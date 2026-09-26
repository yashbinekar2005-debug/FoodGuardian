import { SiteAdapter } from './site_adapter';
import { RawProductData, NutritionData, ProductIdentifiers } from '../types';
import { JsonLdExtractor } from '../extraction/jsonld_extractor';
import { DomExtractor } from '../extraction/dom_extractor';

export class BlinkitAdapter implements SiteAdapter {
  name = 'Blinkit Adapter';

  matches(url: string): boolean {
    return /blinkit\.com\/prn\//i.test(url);
  }

  extractIdentifiers(root: Document): ProductIdentifiers {
    const match = window.location.pathname.match(/\/prn\/[^/]+\/prid\/(\d+)/i);
    const sku = match ? match[1] : null;
    return { gtin: null, asin: null, sku };
  }

  extractIngredients(root: Document): string | null {
    const divs = root.querySelectorAll('div');
    for (const d of Array.from(divs)) {
      if (d.children.length === 0 && /ingredients\s*[:\-]/i.test(d.textContent || '')) {
        const text = d.parentElement?.textContent || d.textContent || '';
        const extracted = DomExtractor.extractIngredientsFromText(text);
        if (extracted) return extracted;
      }
    }
    return null;
  }

  extractNutrition(root: Document): NutritionData | null {
    const divs = root.querySelectorAll('div');
    for (const d of Array.from(divs)) {
      const t = d.textContent || '';
      if (/nutritional\s+info|energy|calories/i.test(t) && t.length < 500) {
        const parsed = DomExtractor.parseNutritionFromText(t);
        if (parsed) return parsed;
      }
    }
    return null;
  }

  extractProduct(root: Document): RawProductData | null {
    const jsonLd = JsonLdExtractor.extract(root);

    const titleEl = root.querySelector('h1');
    const name = titleEl?.textContent?.trim() || jsonLd?.name || null;
    if (!name) return null;

    const brand = jsonLd?.brand || null;
    const ingredients = this.extractIngredients(root) || jsonLd?.ingredients_text || null;
    const nutrition = this.extractNutrition(root) || jsonLd?.nutrition || null;

    return {
      name,
      brand,
      url: window.location.href,
      category: 'packaged_food',
      ingredients_text: ingredients,
      nutrition,
      identifiers: this.extractIdentifiers(root),
      image_url: jsonLd?.image_url || null
    };
  }

  getConfidence(): number {
    return 0.85;
  }
}
