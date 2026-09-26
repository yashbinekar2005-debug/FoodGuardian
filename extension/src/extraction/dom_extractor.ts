import { NutritionData } from '../types';

export class DomExtractor {
  static extractIngredientsFromText(text: string): string | null {
    if (!text) return null;
    const match = text.match(/(?:ingredients|composition|contents)\s*[:\-]\s*([^.]+)/i);
    if (match && match[1]) {
      return match[1].trim();
    }
    return null;
  }

  static parseNutritionFromText(containerText: string): NutritionData | null {
    if (!containerText) return null;

    const data: NutritionData = {};
    let foundAny = false;

    // Helper to find numeric value next to keywords
    const findValue = (regex: RegExp): number | null => {
      const match = containerText.match(regex);
      if (match && match[1]) {
        const val = parseFloat(match[1].replace(',', '.'));
        return isNaN(val) ? null : val;
      }
      return null;
    };

    // Energy / Calories
    const energy = findValue(/(?:energy|calories|kcal)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:kcal|cal)?/i);
    if (energy !== null) {
      data.energy_kcal_100g = energy;
      foundAny = true;
    }

    // Fat
    const fat = findValue(/(?:total\s+fat|fat)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g/i);
    if (fat !== null) {
      data.fat_g_100g = fat;
      foundAny = true;
    }

    // Saturated Fat
    const satFat = findValue(/(?:saturated\s+fat|saturated\s+fatty\s+acids)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g/i);
    if (satFat !== null) {
      data.saturated_fat_g_100g = satFat;
      foundAny = true;
    }

    // Carbohydrates
    const carbs = findValue(/(?:carbohydrate|carbohydrates|total\s+carbs)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g/i);
    if (carbs !== null) {
      data.carbohydrate_g_100g = carbs;
      foundAny = true;
    }

    // Sugars
    const sugars = findValue(/(?:total\s+sugars|sugars|sugar)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g/i);
    if (sugars !== null) {
      data.sugars_g_100g = sugars;
      foundAny = true;
    }

    // Protein
    const protein = findValue(/(?:protein)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g/i);
    if (protein !== null) {
      data.protein_g_100g = protein;
      foundAny = true;
    }

    // Fiber
    const fiber = findValue(/(?:dietary\s+fiber|fiber|fibre)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*g/i);
    if (fiber !== null) {
      data.fiber_g_100g = fiber;
      foundAny = true;
    }

    // Sodium
    const sodium = findValue(/(?:sodium)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*mg/i);
    if (sodium !== null) {
      data.sodium_mg_100g = sodium;
      foundAny = true;
    }

    return foundAny ? data : null;
  }
}
