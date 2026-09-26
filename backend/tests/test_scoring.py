import pytest
from app.scoring.engine import ScoringEngine
from app.services.nutrition_service import NutritionService
from app.schemas.product import NutritionInput


def test_scoring_clean_product():
    nut_input = NutritionInput(
        energy_kcal_100g=350,
        fat_g_100g=4.0,
        saturated_fat_g_100g=1.0,
        sugars_g_100g=3.0,
        protein_g_100g=12.0,
        fiber_g_100g=7.0,
        sodium_mg_100g=100.0
    )
    nut_analysis = NutritionService.analyze_nutrition(nut_input)
    assert nut_analysis["available"] is True
    assert len(nut_analysis["flags"]) == 0

    rating, factors = ScoringEngine.calculate_score(
        nutrition_analysis=nut_analysis,
        additives_detected=[],
        regulatory_evaluations=[],
        ingredients_count=5,
        unknown_ingredients_count=0
    )

    assert rating.grade in ["A", "B"]
    assert rating.score >= 85.0
    assert rating.confidence >= 0.85
    assert any(f.impact == "positive" for f in factors)


def test_scoring_high_sugar_and_banned_additive():
    nut_input = NutritionInput(
        energy_kcal_100g=550,
        fat_g_100g=28.0,
        saturated_fat_g_100g=14.0,
        sugars_g_100g=38.0,
        sodium_mg_100g=850.0
    )
    nut_analysis = NutritionService.analyze_nutrition(nut_input)
    assert "Very high sugar" in nut_analysis["flags"]

    additives = [
        {"name": "Titanium dioxide", "code": "E171", "functional_classes": "food_colour"},
        {"name": "Sunset Yellow FCF", "code": "E110", "functional_classes": "food_colour"}
    ]
    reg_evals = [
        {
            "india": {"status": "authorized"},
            "eu": {"status": "not_authorized", "conditions": "Banned in EU", "labelling": "None"}
        }
    ]

    rating, factors = ScoringEngine.calculate_score(
        nutrition_analysis=nut_analysis,
        additives_detected=additives,
        regulatory_evaluations=reg_evals,
        ingredients_count=12,
        unknown_ingredients_count=1
    )

    assert rating.score < 55.0
    assert rating.grade in ["E", "F"]
    # Check that EU regulatory divergence factor is present
    factor_ids = [f.factor_id for f in factors]
    assert "reg_eu_restriction" in factor_ids
