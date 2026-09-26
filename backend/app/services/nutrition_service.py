from typing import Optional, Dict, Any, List
from app.schemas.product import NutritionInput


class NutritionService:
    @staticmethod
    def analyze_nutrition(nutrition: Optional[NutritionInput]) -> Dict[str, Any]:
        """
        Analyzes and normalizes nutrition facts per 100g.
        Detects excess sugar, saturated fats, and sodium based on WHO/FSSAI benchmarks.
        """
        if not nutrition:
            return {
                "available": False,
                "normalized": {},
                "flags": [],
                "positive_factors": [],
                "negative_factors": [],
                "completeness_score": 0.0
            }

        normalized: Dict[str, Any] = {}
        flags: List[str] = []
        positive_factors: List[Dict[str, Any]] = []
        negative_factors: List[Dict[str, Any]] = []
        present_count = 0
        total_fields = 7

        # 1. Sugars
        if nutrition.sugars_g_100g is not None:
            val = round(float(nutrition.sugars_g_100g), 1)
            normalized["sugars_g_100g"] = val
            present_count += 1
            if val > 22.5:
                flags.append("Very high sugar")
                negative_factors.append({
                    "name": "High Sugar",
                    "value": f"{val}g / 100g",
                    "severity": "high",
                    "delta": -15.0
                })
            elif val > 15.0:
                flags.append("High sugar")
                negative_factors.append({
                    "name": "Elevated Sugar",
                    "value": f"{val}g / 100g",
                    "severity": "medium",
                    "delta": -8.0
                })
            elif val <= 5.0:
                positive_factors.append({
                    "name": "Low Sugar",
                    "value": f"{val}g / 100g",
                    "delta": 5.0
                })

        # 2. Saturated Fat
        if nutrition.saturated_fat_g_100g is not None:
            val = round(float(nutrition.saturated_fat_g_100g), 1)
            normalized["saturated_fat_g_100g"] = val
            present_count += 1
            if val > 10.0:
                flags.append("Very high saturated fat")
                negative_factors.append({
                    "name": "High Saturated Fat",
                    "value": f"{val}g / 100g",
                    "severity": "high",
                    "delta": -12.0
                })
            elif val > 5.0:
                flags.append("High saturated fat")
                negative_factors.append({
                    "name": "Elevated Saturated Fat",
                    "value": f"{val}g / 100g",
                    "severity": "medium",
                    "delta": -6.0
                })
            elif val <= 1.5:
                positive_factors.append({
                    "name": "Low Saturated Fat",
                    "value": f"{val}g / 100g",
                    "delta": 4.0
                })

        # 3. Sodium / Salt
        sodium_mg = nutrition.sodium_mg_100g
        if sodium_mg is None and nutrition.salt_g_100g is not None:
            sodium_mg = round(float(nutrition.salt_g_100g) * 400.0, 1)

        if sodium_mg is not None:
            val = round(float(sodium_mg), 1)
            normalized["sodium_mg_100g"] = val
            present_count += 1
            if val > 900.0:
                flags.append("Very high sodium")
                negative_factors.append({
                    "name": "High Sodium",
                    "value": f"{val}mg / 100g",
                    "severity": "high",
                    "delta": -12.0
                })
            elif val > 500.0:
                flags.append("Moderate sodium")
                negative_factors.append({
                    "name": "Moderate Sodium",
                    "value": f"{val}mg / 100g",
                    "severity": "medium",
                    "delta": -5.0
                })
            elif val <= 120.0:
                positive_factors.append({
                    "name": "Low Sodium",
                    "value": f"{val}mg / 100g",
                    "delta": 4.0
                })

        # 4. Fiber
        if nutrition.fiber_g_100g is not None:
            val = round(float(nutrition.fiber_g_100g), 1)
            normalized["fiber_g_100g"] = val
            present_count += 1
            if val >= 6.0:
                positive_factors.append({
                    "name": "High Dietary Fiber",
                    "value": f"{val}g / 100g",
                    "delta": 8.0
                })
            elif val >= 3.0:
                positive_factors.append({
                    "name": "Source of Fiber",
                    "value": f"{val}g / 100g",
                    "delta": 4.0
                })

        # 5. Protein
        if nutrition.protein_g_100g is not None:
            val = round(float(nutrition.protein_g_100g), 1)
            normalized["protein_g_100g"] = val
            present_count += 1
            if val >= 10.0:
                positive_factors.append({
                    "name": "High Protein",
                    "value": f"{val}g / 100g",
                    "delta": 6.0
                })

        # 6. Energy & Fat
        if nutrition.energy_kcal_100g is not None:
            normalized["energy_kcal_100g"] = round(float(nutrition.energy_kcal_100g), 1)
            present_count += 1
        if nutrition.fat_g_100g is not None:
            normalized["fat_g_100g"] = round(float(nutrition.fat_g_100g), 1)
            present_count += 1

        completeness = min(1.0, round(present_count / total_fields, 2))

        return {
            "available": present_count > 0,
            "normalized": normalized,
            "flags": flags,
            "positive_factors": positive_factors,
            "negative_factors": negative_factors,
            "completeness_score": completeness
        }
