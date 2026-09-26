from typing import Dict, List, Any, Optional
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.regulatory import RegulatoryRule, Jurisdiction, RuleVersion
from app.schemas.regulatory import RegulatoryRuleDetail, RegulatoryJurisdictionStatus


class RegulatoryEngine:
    @staticmethod
    async def evaluate_substance(
        session: AsyncSession,
        substance_id: str,
        food_category: Optional[str] = "all",
        jurisdictions: Optional[List[str]] = None,
        rule_version: str = "current"
    ) -> Dict[str, Any]:
        """
        Evaluates a substance (additive) against official regulatory rules
        for specified jurisdictions in a category-aware manner.
        """
        if jurisdictions is None:
            jurisdictions = ["IN", "EU"]

        category_clean = (food_category or "all").lower().strip()

        # Resolve active rule version if "current"
        active_version = "2026-08"
        if rule_version == "current":
            stmt_v = select(RuleVersion).where(RuleVersion.is_active == True).order_by(RuleVersion.published_at.desc())
            res_v = await session.execute(stmt_v)
            latest_v = res_v.scalar_one_or_none()
            if latest_v:
                active_version = latest_v.version_code
        else:
            active_version = rule_version

        results: Dict[str, Any] = {}

        for jur in jurisdictions:
            jur_upper = jur.upper()
            
            # 1. Try category-specific rule first
            stmt = select(RegulatoryRule).where(
                and_(
                    RegulatoryRule.jurisdiction_id == jur_upper,
                    RegulatoryRule.substance_id == substance_id,
                    RegulatoryRule.version == active_version,
                    RegulatoryRule.food_category == category_clean
                )
            )
            rule_res = await session.execute(stmt)
            rule = rule_res.scalar_one_or_none()

            # 2. Fallback to 'all' categories rule
            if not rule and category_clean != "all":
                stmt_all = select(RegulatoryRule).where(
                    and_(
                        RegulatoryRule.jurisdiction_id == jur_upper,
                        RegulatoryRule.substance_id == substance_id,
                        RegulatoryRule.version == active_version,
                        RegulatoryRule.food_category == "all"
                    )
                )
                rule_res_all = await session.execute(stmt_all)
                rule = rule_res_all.scalar_one_or_none()

            if rule:
                rule_detail = RegulatoryRuleDetail(
                    status=rule.authorization_status,
                    food_category=rule.food_category,
                    conditions=rule.conditions_of_use,
                    maximum_level=rule.maximum_level,
                    maximum_level_unit=rule.maximum_level_unit,
                    labelling_requirement=rule.labelling_requirement,
                    regulation=rule.regulation_name,
                    regulation_number=rule.regulation_number,
                    version=rule.version,
                    source_url=rule.source_url,
                    source_document=rule.source_document
                )

                jurisdiction_key = "india" if jur_upper == "IN" else "eu"
                results[jurisdiction_key] = {
                    "jurisdiction": jur_upper,
                    "status": rule.authorization_status,
                    "food_category": rule.food_category,
                    "maximum_level": f"{rule.maximum_level} {rule.maximum_level_unit or ''}".strip(),
                    "conditions": rule.conditions_of_use or "None specified",
                    "labelling": rule.labelling_requirement or "Standard labelling applies",
                    "source": f"{rule.regulation_name} ({rule.regulation_number})",
                    "source_url": rule.source_url,
                    "source_document": rule.source_document,
                    "rules": [rule_detail.model_dump()]
                }
            else:
                jurisdiction_key = "india" if jur_upper == "IN" else "eu"
                results[jurisdiction_key] = {
                    "jurisdiction": jur_upper,
                    "status": "unknown",
                    "food_category": category_clean,
                    "maximum_level": "Not specified in active ruleset",
                    "conditions": "No category-specific rule found in current snapshot",
                    "labelling": "Standard labelling applies",
                    "source": "Official source record pending verification",
                    "source_url": None,
                    "source_document": None,
                    "rules": []
                }

        # Compare differences factually
        differences = RegulatoryEngine.summarize_differences(substance_id, results)
        results["comparison_summary"] = differences

        return results

    @staticmethod
    def summarize_differences(substance_id: str, jur_results: Dict[str, Any]) -> str:
        in_res = jur_results.get("india")
        eu_res = jur_results.get("eu")

        if not in_res or not eu_res:
            return "Insufficient jurisdictional data to compare."

        in_status = in_res.get("status")
        eu_status = eu_res.get("status")

        if in_status == "unknown" and eu_status == "unknown":
            return "Regulatory status is not currently documented in the active snapshot."

        if in_status == eu_status:
            if in_status == "authorized":
                return f"{substance_id} is authorized in both India (FSSAI) and the European Union."
            return f"Both India and EU apply documented provisions or limits for {substance_id}."

        if eu_status == "not_authorized" and in_status in ["authorized", "limit_applies"]:
            return f"{substance_id} is not authorized for food use in the EU under European Commission regulations, whereas it is permitted under specified conditions in India by FSSAI."

        if eu_res.get("labelling") and "warning" in eu_res.get("labelling", "").lower():
            return f"EU regulations require a mandatory warning label for {substance_id}, while India mandates functional class declaration."

        return f"Documented differences exist in conditions of use or permitted levels between India ({in_status}) and EU ({eu_status})."
