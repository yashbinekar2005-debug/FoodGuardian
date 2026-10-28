from typing import List, Dict, Any, Tuple
from app.schemas.scoring import ScoreRating, ScoringFactor


class ScoringEngine:
    """
    Deterministic ingredient-evidence scoring engine v2.0.
    An ingredient list is required; scores are adjusted only by observed nutrition
    and explicit regulatory evidence. Additive presence alone is not treated as harm.
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

        if ingredients_count <= 0:
            factors.append(ScoringFactor(
                factor_id="rating_missing_ingredients",
                factor_name="Rating unavailable: ingredient list missing",
                impact="neutral",
                weight=1.0,
                score_delta=0.0,
                reason="A product cannot receive an ingredient-based rating until its declared ingredient list is available.",
                evidence="No ingredient tokens were provided for analysis"
            ))
            return ScoreRating(grade="NR", score=0.0, confidence=0.0, rating_available=False), factors

        base_score = 70.0
        total_delta = 0.0
        factors.append(ScoringFactor(
            factor_id="ingredient_list_present",
            factor_name="Declared ingredient list analyzed",
            impact="neutral",
            weight=1.0,
            score_delta=0.0,
            reason=f"The rating is grounded in {ingredients_count} ingredient entries found on the product label.",
            evidence=f"{ingredients_count} ingredient entries analyzed"
        ))

        # ==========================================
        # 1. Nutrition evidence from the declared panel
        # ==========================================
        nutrition_factor_start = len(factors)
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

        # Nutrition label values are direct, measurable evidence; ingredient
        # names alone do not establish that an additive is harmful.
        raw_nut_delta = nut_delta
        nut_delta = max(-25.0, min(20.0, nut_delta))
        if raw_nut_delta and raw_nut_delta != nut_delta:
            scale = nut_delta / raw_nut_delta
            nutrition_factors = factors[nutrition_factor_start:]
            for factor in nutrition_factors:
                factor.score_delta = round(factor.score_delta * scale, 1)
            if nutrition_factors:
                nutrition_factors[-1].score_delta = round(
                    nutrition_factors[-1].score_delta + nut_delta - sum(f.score_delta for f in nutrition_factors), 1
                )
        total_delta += nut_delta

        # ==========================================
        # 2. Additive evidence: presence is reported, not automatically penalized.
        # ==========================================
        add_delta = 0.0
        if additives_detected:
            additive_names = [a.get("name", "Unknown") for a in additives_detected]
            factors.append(ScoringFactor(
                factor_id="additives_identified",
                factor_name=f"{len(additive_names)} declared additive(s) identified",
                impact="neutral",
                weight=1.0,
                score_delta=0.0,
                reason="Additive presence alone does not lower the rating; only explicit regulatory restrictions or label warnings affect the score.",
                evidence=f"Detected: {', '.join(additive_names)}"
            ))

        total_delta += add_delta

        # ==========================================
        # 3. Explicit regulatory restrictions and required warnings
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
        if banned_in_eu > 0:
            reg_delta = max(-20.0, -(banned_in_eu * 15.0))
            factors.append(ScoringFactor(
                factor_id="reg_eu_restriction",
                factor_name="- EU Regulatory Divergence",
                impact="negative",
                weight=0.20,
                score_delta=reg_delta,
                reason=f"{banned_in_eu} detected ingredient(s) are marked not authorized in the EU comparison used for this analysis.",
                evidence="EU Regulation 1333/2008 / Commission Regulation 2022/63"
            ))
        elif warnings_required > 0:
            reg_delta = max(-20.0, -(warnings_required * 6.0))
            factors.append(ScoringFactor(
                factor_id="reg_warning_mandatory",
                factor_name="- Mandatory Advisory Warning",
                impact="negative",
                weight=0.10,
                score_delta=reg_delta,
                reason="Jurisdiction requires special advisory warning on label (e.g. child attention/MSG/phenylalanine).",
                evidence="Annex V EC 1333/2008 / FSSAI Labelling Regulation"
            ))
        elif regulatory_evaluations:
            factors.append(ScoringFactor(
                factor_id="reg_no_explicit_concern",
                factor_name="No explicit restriction or warning found",
                impact="neutral",
                weight=0.0,
                score_delta=0.0,
                reason="The compared records did not identify a restriction or required warning. This does not establish that the product is healthy.",
                evidence="Regulatory comparison for detected additives"
            ))
        total_delta += reg_delta

        # Unresolved tokens reduce confidence, not product health score: a
        # database lookup failure is not evidence that an ingredient is harmful.

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

        return ScoreRating(grade=grade, score=final_score, confidence=confidence, rating_available=True), factors

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
