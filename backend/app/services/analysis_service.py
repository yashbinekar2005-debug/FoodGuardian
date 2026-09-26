import hashlib
import json
import uuid
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.models.scoring import AnalysisResult, AnalysisFactor
from app.models.product import Product, ProductIdentifier
from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse, AnalyzeSummary, EvidenceItem, RuleMetadata
from app.schemas.ingredient import NormalizedIngredient
from app.normalization.ingredient_normalizer import normalizer
from app.services.additive_service import AdditiveService
from app.services.nutrition_service import NutritionService
from app.regulatory.engine import RegulatoryEngine
from app.scoring.engine import ScoringEngine


class AnalysisService:
    @staticmethod
    def compute_product_hash(request: AnalyzeRequest) -> str:
        prod = request.product
        raw_key = f"{prod.name}|{prod.brand or ''}|{prod.category or ''}|{prod.ingredients_text or ''}|{json.dumps(prod.nutrition.model_dump() if prod.nutrition else {})}"
        return hashlib.sha256(raw_key.encode('utf-8')).hexdigest()

    @staticmethod
    async def analyze_product(session: AsyncSession, request: AnalyzeRequest) -> AnalyzeResponse:
        prod_input = request.product
        product_hash = AnalysisService.compute_product_hash(request)
        analysis_id = f"anl_{uuid.uuid4().hex[:12]}"

        # 1. Normalize ingredients
        raw_text = prod_input.ingredients_text or ""
        parsed_tokens = normalizer.tokenize_and_normalize(raw_text)

        normalized_ingredients: List[NormalizedIngredient] = []
        detected_additives: List[Dict[str, Any]] = []
        regulatory_evaluations: List[Dict[str, Any]] = []
        evidence_items: List[EvidenceItem] = []

        unknown_count = 0
        seen_additive_codes = set()

        for token in parsed_tokens:
            additive = await AdditiveService.match_token(session, token)
            if additive:
                is_additive = True
                code = additive.code
                name = additive.name
                func_class = additive.functional_classes.split(",")[0] if additive.functional_classes else "food_additive"

                if code not in seen_additive_codes:
                    seen_additive_codes.add(code)
                    # Evaluate regulatory status
                    reg_eval = await RegulatoryEngine.evaluate_substance(
                        session=session,
                        substance_id=code,
                        food_category=prod_input.category or "all",
                        jurisdictions=request.jurisdictions,
                        rule_version=request.rule_version or "current"
                    )
                    regulatory_evaluations.append(reg_eval)

                    detected_additives.append({
                        "name": name,
                        "code": code,
                        "ins_code": additive.ins_code,
                        "functional_class": func_class,
                        "functional_classes": additive.functional_classes,
                        "description": additive.description,
                        "regulatory_status": {
                            "india": reg_eval.get("india", {}).get("status", "unknown"),
                            "eu": reg_eval.get("eu", {}).get("status", "unknown")
                        },
                        "comparison_summary": reg_eval.get("comparison_summary", "")
                    })

                    # Add official evidence items
                    for jur_name, j_data in [("India (FSSAI)", reg_eval.get("india")), ("EU", reg_eval.get("eu"))]:
                        if j_data and j_data.get("source_url"):
                            evidence_items.append(EvidenceItem(
                                type="regulatory",
                                jurisdiction="IN" if "India" in jur_name else "EU",
                                source=j_data.get("source", "Official regulation"),
                                details=f"{name} ({code}) {j_data.get('status')}: {j_data.get('conditions')}",
                                url=j_data.get("source_url")
                            ))
            else:
                is_additive = False
                code = None
                name = token["clean_name"].title()
                func_class = "ingredient"
                if len(token["clean_name"]) <= 2:
                    unknown_count += 1

            normalized_ingredients.append(NormalizedIngredient(
                name=name,
                code=code,
                type=func_class,
                is_additive=is_additive,
                confidence=0.95 if is_additive else 0.85,
                raw_text=token["raw_text"]
            ))

        # 2. Nutrition analysis
        nut_analysis = NutritionService.analyze_nutrition(prod_input.nutrition)
        if nut_analysis.get("available"):
            evidence_items.append(EvidenceItem(
                type="nutrition",
                source="Extracted Product Nutrition Label",
                details=f"Normalized per 100g values: {', '.join(f'{k}: {v}' for k, v in nut_analysis['normalized'].items())}"
            ))

        # 3. Overall Consolidated Regulatory Comparison
        consolidated_comparison: Dict[str, Any] = {"india": [], "eu": []}
        for reg in regulatory_evaluations:
            if "india" in reg:
                consolidated_comparison["india"].append(reg["india"])
            if "eu" in reg:
                consolidated_comparison["eu"].append(reg["eu"])

        # 4. Score calculation
        rating, factors = ScoringEngine.calculate_score(
            nutrition_analysis=nut_analysis,
            additives_detected=detected_additives,
            regulatory_evaluations=regulatory_evaluations,
            ingredients_count=len(normalized_ingredients),
            unknown_ingredients_count=unknown_count
        )

        summary = AnalyzeSummary(
            ingredient_count=len(normalized_ingredients),
            recognized_additives=len(detected_additives),
            unknown_ingredients=unknown_count,
            flags_count=len(nut_analysis.get("flags", []))
        )

        product_dict = {
            "name": prod_input.name,
            "normalized_name": prod_input.name.strip(),
            "brand": prod_input.brand,
            "category": prod_input.category,
            "url": prod_input.url,
            "identifiers": prod_input.identifiers.model_dump() if prod_input.identifiers else {}
        }

        response = AnalyzeResponse(
            analysis_id=analysis_id,
            product=product_dict,
            rating=rating,
            summary=summary,
            ingredients=normalized_ingredients,
            additives=detected_additives,
            nutrition=nut_analysis,
            regulatory_comparison=consolidated_comparison,
            evidence=evidence_items,
            factors=factors,
            rules=RuleMetadata(
                regulatory_version=settings.REGULATORY_DATA_VERSION,
                scoring_version=settings.SCORING_METHODOLOGY_VERSION
            )
        )

        # 5. Persist analysis result for auditability and history
        try:
            db_res = AnalysisResult(
                id=uuid.UUID(analysis_id.replace("anl_", "")),
                product_hash=product_hash,
                grade=rating.grade,
                score=rating.score,
                confidence=rating.confidence,
                scoring_version=settings.SCORING_METHODOLOGY_VERSION,
                regulatory_version=settings.REGULATORY_DATA_VERSION,
                result_payload=json.dumps(response.model_dump(), default=str)
            )
            session.add(db_res)
            await session.flush()

            for f in factors:
                session.add(AnalysisFactor(
                    analysis_id=db_res.id,
                    factor_id=f.factor_id,
                    factor_name=f.factor_name,
                    impact=f.impact,
                    weight=f.weight,
                    score_delta=f.score_delta,
                    reason=f.reason,
                    evidence=f.evidence
                ))
            await session.commit()
        except Exception:
            # Fallback if DB save has transient constraint, do not break analysis response
            await session.rollback()

        return response
