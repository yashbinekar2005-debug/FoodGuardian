import { NutritionData } from '../types';

export class DomExtractor {
  static extractIngredientsFromText(text: string): string | null {
    if (!text) return null;
    
    // Support "Ingredients:", "Ingredients -", "Ingredients\n", "Key ingredients", "Ingredients (per 100g)" etc.
    const pattern = /(?:key\s+|active\s+|main\s+|list\s+of\s+)?(?:ingredients?|composition|contents)\s*(?:[:\-\n\r\t]+|\s{2,}|\s*(?:\([^)]*\)\s*)?[:\-\n])\s*([\s\S]+?)(?=(?:\r?\n\s*\r?\n\s*\r?\n|allergens|allergy|nutrition|nutritional|warning|storage|legal disclaimer|directions|safety|how to use|fssai|marketed by|manufactured by|$))/i;
    
    const match = text.match(pattern);
    if (match && match[1]) {
      let cleaned = match[1].trim();
      cleaned = cleaned.replace(/\.\s*$/, '').trim();
      if (cleaned.length > 5 && !/^(none|na|n\/a|details?)$/i.test(cleaned)) {
        return cleaned;
      }
    }
    return null;
  }

  static scanDomForIngredients(root: Document | Element): string | null {
    // 1. Direct container elements by ID, class, or data attribute
    const directSelectors = [
      '#nic-ingredients-content',
      '#ingredients-content',
      '[data-feature-name="ingredients"]',
      '#ingredients_feature_div',
      'div[data-qa="ingredients"]',
      'div[class*="PackagedFoodDetails"]',
      'div[class*="Ingredients"]',
      'div[class*="ingredients"]',
      'div[id*="ingredients"]',
      'section[class*="ingredient"]'
    ];
    for (const sel of directSelectors) {
      const el = root.querySelector(sel);
      if (el && el.textContent?.trim()) {
        const text = el.textContent.trim();
        const extracted = this.extractIngredientsFromText(text) || text;
        const cleaned = extracted.replace(/^(?:key\s+|main\s+)?(?:ingredients?|composition|contents)\s*[:\-\n ]*/i, '').trim();
        if (cleaned.length > 5 && !/^(ingredients?|none)$/i.test(cleaned)) {
          return cleaned;
        }
      }
    }

    // 2. Table rows & specification lists (Amazon, BigBasket, generic specs)
    const tableRows = root.querySelectorAll('tr, dl, div[class*="row"], div[class*="Specification"], div[class*="ItemDetail"]');
    for (const row of Array.from(tableRows)) {
      const text = row.textContent || '';
      if (/ingredient/i.test(text)) {
        const valCell = row.querySelector('td, dd, [class*="value"], [class*="desc"], .prodDetAttrValue');
        if (valCell && valCell.textContent?.trim()) {
          const val = valCell.textContent.trim();
          if (val.length > 5 && !/^(ingredients?|none)$/i.test(val)) {
            return val;
          }
        }
        const extracted = this.extractIngredientsFromText(text);
        if (extracted) return extracted;
      }
    }

    // 3. Headings / Labels followed by sibling elements (e.g. <h4>Ingredients</h4> <p>...</p>)
    const headers = root.querySelectorAll('h2, h3, h4, h5, h6, strong, b, dt, span[class*="label"], div[class*="title"], div[class*="label"], div[class*="header"]');
    for (const h of Array.from(headers)) {
      const text = h.textContent?.trim() || '';
      if (/^(?:key\s+|main\s+)?ingredients?(?:\s*[:\-])?$/i.test(text)) {
        let next = h.nextElementSibling;
        if (!next && h.parentElement) {
          next = h.parentElement.nextElementSibling;
        }
        if (next && next.textContent?.trim()) {
          const val = next.textContent.trim();
          if (val.length > 5 && !/^(ingredients?|none)$/i.test(val)) {
            return val;
          }
        }
      }
    }

    // 4. Feature bullets, product description, and important info blocks
    const contentBlocks = root.querySelectorAll(
      '#important-information, #importantInformation, #productDescription, #featurebullets_feature_div, #detailBullets_feature_div, #aplus, div[class*="Description"], div[class*="Details"]'
    );
    for (const block of Array.from(contentBlocks)) {
      const text = block.textContent || '';
      if (/ingredient/i.test(text)) {
        const extracted = this.extractIngredientsFromText(text);
        if (extracted) return extracted;
      }
    }

    // 5. Deep text scan across paragraphs and list items
    const elements = root.querySelectorAll('p, li, div');
    for (const el of Array.from(elements)) {
      if (el.children.length <= 2) {
        const text = el.textContent || '';
        if (/^(?:key\s+|active\s+|main\s+)?ingredients?\s*[:\-\n ]+/i.test(text.trim())) {
          const extracted = this.extractIngredientsFromText(text);
          if (extracted) return extracted;
        }
      }
    }

    return null;
  }

  static scanDomForNutrition(root: Document | Element): NutritionData | null {
    const nutritionBlocks = root.querySelectorAll(
      'table[class*="Nutrition"], div[class*="Nutrition"], div[class*="nutrition"], #technicalSpecifications_section_1, #important-information, #productDetails_feature_div, #detailBullets_feature_div'
    );
    for (const block of Array.from(nutritionBlocks)) {
      const text = block.textContent || '';
      if (/energy|calorie|fat|sugar|protein|sodium/i.test(text)) {
        const parsed = this.parseNutritionFromText(text);
        if (parsed) return parsed;
      }
    }

    const fullText = (root instanceof Document ? root.body?.textContent : root.textContent) || '';
    return this.parseNutritionFromText(fullText);
  }

  static parseNutritionFromText(containerText: string): NutritionData | null {
    if (!containerText) return null;

    const data: NutritionData = {};
    let foundAny = false;

    // Helper to find numeric value next to keywords, with optional units
    const findValue = (regex: RegExp): number | null => {
      const match = containerText.match(regex);
      if (match && match[1]) {
        const val = parseFloat(match[1].replace(',', '.'));
        return isNaN(val) ? null : val;
      }
      return null;
    };

    // Energy / Calories
    const energy = findValue(/(?:energy|calories|kcal)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:kcal|cal|kj)?/i);
    if (energy !== null) {
      data.energy_kcal_100g = energy;
      foundAny = true;
    }

    // Fat
    const fat = findValue(/(?:total\s+fat|fat)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:g|gm|grams)?/i);
    if (fat !== null) {
      data.fat_g_100g = fat;
      foundAny = true;
    }

    // Saturated Fat
    const satFat = findValue(/(?:saturated\s+fat|saturated\s+fatty\s+acids|sat\s+fat)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:g|gm|grams)?/i);
    if (satFat !== null) {
      data.saturated_fat_g_100g = satFat;
      foundAny = true;
    }

    // Carbohydrates
    const carbs = findValue(/(?:carbohydrate|carbohydrates|total\s+carbs|carbs)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:g|gm|grams)?/i);
    if (carbs !== null) {
      data.carbohydrate_g_100g = carbs;
      foundAny = true;
    }

    // Sugars
    const sugars = findValue(/(?:total\s+sugars|sugars|sugar|added\s+sugars)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:g|gm|grams)?/i);
    if (sugars !== null) {
      data.sugars_g_100g = sugars;
      foundAny = true;
    }

    // Protein
    const protein = findValue(/(?:protein)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:g|gm|grams)?/i);
    if (protein !== null) {
      data.protein_g_100g = protein;
      foundAny = true;
    }

    // Fiber
    const fiber = findValue(/(?:dietary\s+fiber|fiber|fibre)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:g|gm|grams)?/i);
    if (fiber !== null) {
      data.fiber_g_100g = fiber;
      foundAny = true;
    }

    // Sodium
    const sodium = findValue(/(?:sodium)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:mg|milligrams|g)?/i);
    if (sodium !== null) {
      data.sodium_mg_100g = sodium;
      foundAny = true;
    }

    return foundAny ? data : null;
  }
}
