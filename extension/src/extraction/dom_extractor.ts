import { NutritionData } from '../types';

export class DomExtractor {
  static extractIngredientsFromText(text: string): string | null {
    if (!text) return null;

    // Product pages and OCR often flatten the label and value into one text run.
    // Normalize whitespace while preserving line breaks so wrapped package text
    // remains readable, then stop at the next common package-information label.
    const normalized = text.replace(/\r/g, '\n').replace(/[\t ]+/g, ' ').replace(/\n{3,}/g, '\n\n');
    // A real label must end with punctuation or a line break. Requiring this
    // boundary prevents prose such as "blend of ingredients to provide a great
    // taste" from being mistaken for an ingredient declaration.
    const label = /(?:key[ \t]+|active[ \t]+|main[ \t]+|list[ \t]+of[ \t]+)?(?:ingredients?|composition|contents)(?:[ \t]*\([^)]*\))?[ \t]*(?:[:\-–][ \t]*|\n[ \t]*)/gi;
    const stopLabels = /\b(?:allergens?|allergy advice|may contain|contains|nutrition(?:al)? information|nutrition facts|warning|storage|legal disclaimer|directions|safety|how to use|fssai|marketed by|manufactured by|best before|customer care|mrp|net weight)\b/i;

    for (const match of normalized.matchAll(label)) {
      const start = (match.index || 0) + match[0].length;
      let candidate = normalized.slice(start);
      const stopAt = candidate.search(stopLabels);
      if (stopAt >= 0) candidate = candidate.slice(0, stopAt);
      candidate = candidate.split(/\n\s*\n/, 1)[0]
        .replace(/^[\s:;,.\-–]+|[\s;,.\-–]+$/g, '')
        .trim();
      if (candidate.length > 5 && candidate.length <= 2000 && !/^(none|na|n\/a|details?|not listed)$/i.test(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  static scanDomForIngredients(root: Document | Element): string | null {
    const readableText = (node: Element): string => (node as HTMLElement).innerText || node.textContent || '';
    // 1. Direct container elements by ID, class, or data attribute
    const directSelectors = [
      '#nic-ingredients-content',
      '#ingredients-content',
      '#productDetails_techSpec_section_1',
      '#productDetails_db_sections',
      '#detailBullets_feature_div',
      '[data-feature-name="ingredients"]',
      '#ingredients_feature_div',
      'div[data-qa="ingredients"]',
      'div[class*="PackagedFoodDetails"]',
      'div[class*="Ingredients"]',
      'div[class*="ingredients"]',
      'div[class*="ProductDetails"]',
      'div[class*="product-details"]',
      '[data-testid*="product-detail"]',
      '[data-testid*="specification"]',
      'div[id*="ingredients"]',
      'section[class*="ingredient"]',
      '.a-section.a-spacing-medium.a-spacing-top-small',
      'table#productDetails_techSpec_table'
    ];
    for (const sel of directSelectors) {
      const el = root.querySelector(sel);
      if (el && readableText(el).trim()) {
        const text = readableText(el).trim();
        // Check if this block contains ingredients
        if (/ingredient/i.test(text)) {
          const extracted = this.extractIngredientsFromText(text);
          if (extracted) {
            const cleaned = extracted.replace(/^(?:key\s+|main\s+|active\s+)?(?:ingredients?|composition|contents)\s*[:\-\n ]*/i, '').trim();
            if (cleaned.length > 5 && !/^(ingredients?|none|na)$/i.test(cleaned)) {
              return cleaned;
            }
          }
          const isIngredientContainer = /ingredients/i.test(sel);
          const cleaned = text.replace(/^(?:key\s+|main\s+|active\s+)?(?:ingredients?|composition|contents)\s*[:\-\n ]*/i, '').trim();
          if (isIngredientContainer && cleaned.length > 5 && !/^(ingredients?|none|na)$/i.test(cleaned)) {
            return cleaned;
          }
        }
      }
    }

    // 2. Table rows & specification lists (Amazon, BigBasket, generic specs)
    const tableRows = root.querySelectorAll('tr, dl, div[class*="row"], div[class*="Specification"], div[class*="ItemDetail"], div[class*="detail"], [data-testid*="specification"], li');
    for (const row of Array.from(tableRows)) {
      const text = readableText(row);
      if (/\bingredients?\b/i.test(text)) {
        const cells = Array.from(row.querySelectorAll('th, td, dt, dd, [class*="value"], [class*="desc"], .prodDetAttrValue'));
        const labelIndex = cells.findIndex((cell) => /^(?:key\s+)?ingredients?\s*[:\-–]?$/i.test(readableText(cell).trim()));
        const valueCell = labelIndex >= 0 ? cells[labelIndex + 1] : null;
        if (valueCell && readableText(valueCell).trim()) {
          const val = readableText(valueCell).trim();
          if (val.length > 5 && !/^(ingredients?|none)$/i.test(val) && /[a-z]/i.test(val)) {
            const extracted = this.extractIngredientsFromText(val) || val;
            const cleaned = extracted.replace(/^(?:key\s+|main\s+)?(?:ingredients?|composition|contents)\s*[:\-\n ]*/i, '').trim();
            if (cleaned.length > 5) return cleaned;
          }
        }
        const extracted = this.extractIngredientsFromText(text);
        if (extracted) return extracted;
      }
    }

    // 3. Headings / Labels followed by sibling elements (e.g. <h4>Ingredients</h4> <p>...</p>)
    const headers = root.querySelectorAll('h2, h3, h4, h5, h6, strong, b, dt, span[class*="label"], div[class*="title"], div[class*="label"], div[class*="header"], th');
    for (const h of Array.from(headers)) {
        const text = readableText(h).trim();
      if (/^(?:key\s+)?ingredients?\s*[:\-–]?$/i.test(text) && text.length < 50) {
        let next = h.nextElementSibling;
        if (!next && h.parentElement) {
          next = h.parentElement.nextElementSibling;
        }
        if (next && next.textContent?.trim()) {
          const val = readableText(next).trim();
          if (val.length > 5 && !/^(ingredients?|none)$/i.test(val)) {
            const extracted = this.extractIngredientsFromText(val) || val;
            const cleaned = extracted.replace(/^(?:key\s+|main\s+)?(?:ingredients?|composition|contents)\s*[:\-\n ]*/i, '').trim();
            if (cleaned.length > 5) return cleaned;
          }
        }
        // Also check parent's next sibling
        if (h.parentElement?.nextElementSibling) {
          const val = readableText(h.parentElement.nextElementSibling).trim();
          if (val && val.length > 5 && !/^(ingredients?|none)$/i.test(val)) {
            const extracted = this.extractIngredientsFromText(val) || val;
            const cleaned = extracted.replace(/^(?:key\s+|main\s+)?(?:ingredients?|composition|contents)\s*[:\-\n ]*/i, '').trim();
            if (cleaned.length > 5) return cleaned;
          }
        }
      }
    }

    // 4. Feature bullets, product description, and important info blocks
    const contentBlocks = root.querySelectorAll(
      '#important-information, #importantInformation, #productDescription, #featurebullets_feature_div, #detailBullets_feature_div, #aplus, div[class*="Description"], div[class*="Details"]'
    );
    for (const block of Array.from(contentBlocks)) {
      const text = readableText(block);
      if (/ingredient/i.test(text)) {
        const extracted = this.extractIngredientsFromText(text);
        if (extracted) return extracted;
      }
    }

    // 5. Deep text scan across paragraphs and list items
    const elements = root.querySelectorAll('p, li, div, span');
    for (const el of Array.from(elements)) {
      if (el.children.length <= 2) {
        const text = readableText(el);
        if (/(?:^|\n|\s)(?:key\s+|active\s+|main\s+)?ingredients?\s*[:\-\n ]+/i.test(text.trim())) {
          const extracted = this.extractIngredientsFromText(text);
          if (extracted) {
            const cleaned = extracted.replace(/^(?:key\s+|main\s+|active\s+)?(?:ingredients?|composition|contents)\s*[:\-\n ]*/i, '').trim();
            if (cleaned.length > 5) return cleaned;
          }
        }
      }
    }

    // 6. Last resort: scan full body text
    try {
      const fullText = root instanceof Document
        ? (root.body?.innerText || root.body?.textContent || '')
        : (root as HTMLElement).innerText || root.textContent || '';
      if (fullText && /ingredient/i.test(fullText)) {
        const extracted = this.extractIngredientsFromText(fullText);
        if (extracted) {
          const cleaned = extracted.replace(/^(?:key\s+|main\s+|active\s+)?(?:ingredients?|composition|contents)\s*[:\-\n ]*/i, '').trim();
          if (cleaned.length > 5) return cleaned;
        }
        // Try to find pattern more directly
        const m = fullText.match(/ingredients?\s*[:\-]\s*([^\n\r]{10,500})/i);
        if (m && m[1]) {
          let cand = m[1].trim();
          cand = cand.replace(/\.(?:\s|$).*$/s, '').trim();
          if (cand.length > 5) return cand;
        }
      }
    } catch (e) {
      // ignore
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
