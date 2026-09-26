from typing import List, Dict, Any, Tuple
from app.schemas.scoring import ScoreRating, ScoringFactor


class ScoringEngine:
    """
    Deterministic FoodGuardian 5-factor scoring engine v1.0.
    Produces reproducible 0-100 score, A-F grade, confidence, and factor explainability.
    """

    GRADE_THRESHOLDS = [
        ("A", 90.0, 100.0),
        ("B", 80.0, 89.9),
        ("C", 70.0, 79.9),
        ("D", 60.0, 69.9),
        ("E", 40.0, 59.9),
        ("F", 0.0, 39.9),
    ]

    @classmethod
    def calculate_score(
        cls,
        nutrition_analysis: Dict[str, Any],
        additives_detected: List[Dict[str, Any]],
        regulatory_evaluations: List[Dict[str, Any]],
        ingredients_count: int,
        unknown_ingredients_count: int,
        has_allergen_declaration: bool = True
    ) -> Tuple[ScoreRating, List[ScoringFactor]]:
        factors: List[ScoringFactor] = []

        base_score = 70.0  # Neutral baseline
        total_delta = 0.0

        # ==========================================
        # 1. Nutrition Component (Weight 40%)
        # ==========================================
        nut_delta = 0.0
        if nutrition_analysis.get("available"):
            # Positive nutrition factors
            for pos in nutrition_analysis.get("positive_factors", []):
                nut_delta += pos["delta"]
                factors.append(ScoringFactor(
                    factor_id=f"nut_pos_{pos['name'].lower().replace(' ', '_')}",
                    factor_name=f"+ {pos['name']}",
                    impact="positive",
                    weight=0.10,
                    score_delta=pos["delta"],
                    reason=f"Beneficial nutritional profile ({pos['value']}).",
                    evidence=f"Nutrition data per 100g: {pos['value']}"
                ))

            # Negative nutrition factors
            for neg in nutrition_analysis.get("negative_factors", []):
                nut_delta += neg["delta"]
                factors.append(ScoringFactor(
                    factor_id=f"nut_neg_{neg['name'].lower().replace(' ', '_')}",
                    factor_name=f"- {neg['name']}",
                    impact="negative",
                    weight=0.15,
                    score_delta=neg["delta"],
                    reason=f"Exceeds recommended benchmark ({neg['value']}).",
                    evidence=f"Nutrition data per 100g: {neg['value']}"
                ))
        else:
            factors.append(ScoringFactor(
                factor_id="nut_missing",
                factor_name="Nutrition Data Unavailable",
                impact="neutral",
                weight=0.40,
                score_delta=0.0,
                reason="Nutrition facts were not available on the product page.",
                evidence="No nutrition panel detected"
            ))

        # Clamp nutrition delta to [-25, +20]
        nut_delta = max(-25.0, min(20.0, nut_delta))
        total_delta += nut_delta

        # ==========================================
        # 2. Additive Component (Weight 20%)
        # ==========================================
        add_delta = 0.0
        if not additives_detected:
            add_delta += 8.0
            factors.append(ScoringFactor(
                factor_id="add_none",
                factor_name="+ No Artificial Additives",
                impact="positive",
                weight=0.20,
                score_delta=8.0,
                reason="No synthetic food additives or E-numbers identified.",
                evidence="Full ingredient list verified"
            ))
        else:
            additive_names = [a.get("name", "Unknown") for a in additives_detected]
            num_additives = len(additives_detected)

            # Benign vs high concern additives
            has_colour = any("colour" in a.get("functional_classes", "") for a in additives_detected)
            has_preservative = any("preservative" in a.get("functional_classes", "") for a in additives_detected)
            has_sweetener = any("sweetener" in a.get("functional_classes", "") for a in additives_detected)

            penalty = num_additives * 3.0
            if has_colour:
                penalty += 4.0
            if has_sweetener:
                penalty += 4.0

            add_delta = -min(20.0, penalty)
            factors.append(ScoringFactor(
                factor_id="add_detected",
                factor_name=f"- {num_additives} Additives Identified",
                impact="negative",
                weight=0.20,
                score_delta=add_delta,
                reason=f"Identified {num_additives} food additives: {', '.join(additive_names[:4])}.",
                evidence=f"Detected additives: {', '.join(additive_names)}"
            ))

        total_delta += add_delta

        # ==========================================
        # 3. Regulatory Alignment Component (Weight 20%)
        # ==========================================
        reg_delta = 0.0
        divergences = 0
        banned_in_eu = 0
        warnings_required = 0

        for reg in regulatory_evaluations:
            eu_info = reg.get("eu", {})
            in_info = reg.get("india", {})

            if eu_info.get("status") == "not_authorized":
                banned_in_eu += 1
            if "warning" in eu_info.get("labelling", "").lower() or "warning" in in_info.get("labelling", "").lower():
                warnings_required += 1
            if in_info.get("status") != eu_info.get("status"):
                divergences += 1

        if banned_in_eu > 0:
            reg_delta -= (banned_in_eu * 15.0)
            factors.append(ScoringFactor(
                factor_id="reg_eu_restriction",
                factor_name="- EU Regulatory Divergence",
                impact="negative",
                weight=0.20,
                score_delta=-15.0,
                reason="Contains ingredient not authorized for food use in the European Union.",
                evidence="EU Regulation 1333/2008 / Commission Regulation 2022/63"
            ))
        elif warnings_required > 0:
            reg_delta -= (warnings_required * 6.0)
            factors.append(ScoringFactor(
                factor_id="reg_warning_mandatory",
                factor_name="- Mandatory Advisory Warning",
                impact="negative",
                weight=0.10,
                score_delta=-6.0,
                reason="Jurisdiction requires special advisory warning on label (e.g. child attention/MSG/phenylalanine).",
                evidence="Annex V EC 1333/2008 / FSSAI Labelling Regulation"
            ))
        elif additives_detected and divergences == 0:
            reg_delta += 5.0
            factors.append(ScoringFactor(
                factor_id="reg_concordance",
                factor_name="+ Cross-Jurisdiction Alignment",
                impact="positive",
                weight=0.20,
                score_delta=5.0,
                reason="All detected additives are authorized under both FSSAI and European Union food frameworks.",
                evidence="FSSAI Compendium & EU Union List"
            ))

        reg_delta = max(-20.0, min(10.0, reg_delta))
        total_delta += reg_delta

        # ==========================================
        # 4. Transparency & Allergens (Weight 20%)
        # ==========================================
        if ingredients_count > 0:
            if unknown_ingredients_count == 0:
                total_delta += 4.0
                factors.append(ScoringFactor(
                    factor_id="transparency_high",
                    factor_name="+ Full Ingredient Transparency",
                    impact="positive",
                    weight=0.10,
                    score_delta=4.0,
                    reason="All listed ingredients were cleanly tokenized and resolved.",
                    evidence=f"{ingredients_count} ingredients parsed successfully"
                ))
            else:
                total_delta -= 3.0
                factors.append(ScoringFactor(
                    factor_id="transparency_partial",
                    factor_name="- Unrecognized Ingredient Tokens",
                    impact="negative",
                    weight=0.10,
                    score_delta=-3.0,
                    reason=f"{unknown_ingredients_count} ingredient tokens could not be definitively matched.",
                    evidence="Unmatched raw tokens"
                ))

        # Final score calculation
        final_score = round(max(0.0, min(100.0, base_score + total_delta)), 1)

        # Convert score to grade
        grade = "C"
        for g, low, high in cls.GRADE_THRESHOLDS:
            if low <= final_score <= high:
                grade = g
                break

        # Calculate Data Confidence
        confidence = cls._calculate_confidence(
            has_ingredients=ingredients_count > 0,
            has_nutrition=nutrition_analysis.get("available", False),
            nutrition_completeness=nutrition_analysis.get("completeness_score", 0.0),
            unknown_ratio=unknown_ingredients_count / max(1, ingredients_count)
        )

        return ScoreRating(grade=grade, score=final_score, confidence=confidence), factors

    @staticmethod
    def _calculate_confidence(
        has_ingredients: bool,
        has_nutrition: bool,
        nutrition_completeness: float,
        unknown_ratio: float
    ) -> float:
        score = 0.0
        if has_ingredients:
            score += 0.45 * (1.0 - min(0.5, unknown_ratio))
        if has_nutrition:
            score += 0.45 * nutrition_completeness
        else:
            score += 0.05
        # Base metadata score
        score += 0.10
        return round(max(0.2, min(1.0, score)), 2)
