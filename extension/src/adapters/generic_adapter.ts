import { SiteAdapter } from './site_adapter';
import { RawProductData, NutritionData, ProductIdentifiers } from '../types';
import { JsonLdExtractor } from '../extraction/jsonld_extractor';
import { DomExtractor } from '../extraction/dom_extractor';

export class GenericAdapter implements SiteAdapter {
  name = 'Generic E-Commerce Adapter';

  matches(_url: string): boolean {
    return true; // Fallback matches everything
  }

  extractIdentifiers(root: Document): ProductIdentifiers {
    const jsonLd = JsonLdExtractor.extract(root);
    return jsonLd?.identifiers || { gtin: null, asin: null, sku: null };
  }

  extractIngredients(root: Document): string | null {
    // 1. JSON-LD
    const jsonLd = JsonLdExtractor.extract(root);
    if (jsonLd?.ingredients_text) return jsonLd.ingredients_text;

    // 2. DOM text scan
    const candidates = root.querySelectorAll('p, div, li, span');
    for (const el of Array.from(candidates)) {
      const text = el.textContent || '';
      if (/^ingredients\s*[:\-]/i.test(text.trim()) && text.length < 1500) {
        return text.replace(/^ingredients\s*[:\-]/i, '').trim();
      }
    }
    return null;
  }

  extractNutrition(root: Document): NutritionData | null {
    const fullText = root.body?.textContent || '';
    return DomExtractor.parseNutritionFromText(fullText);
  }

  extractProduct(root: Document): RawProductData | null {
    const jsonLd = JsonLdExtractor.extract(root);

    // Name with robust fallbacks
    const h1 = root.querySelector('h1')?.textContent?.trim();
    const metaTitle = root.querySelector('meta[property="og:title"], meta[name="twitter:title"]')?.getAttribute('content');
    const titleClass = root.querySelector('[class*="product-title"], [class*="product_name"], [data-qa="product-title"]')?.textContent?.trim();
    const rawDocTitle = typeof document !== 'undefined' ? document.title.replace(/\s*[-|].*$/, '').trim() : '';
    let name = jsonLd?.name || h1 || metaTitle || titleClass || (rawDocTitle && rawDocTitle.length > 3 ? rawDocTitle : null);

    if (!name) return null;
    name = name.replace(/\s+/g, ' ').trim();

    // Brand
    const metaBrand = root.querySelector('meta[property="product:brand"]')?.getAttribute('content');
    const brand = jsonLd?.brand || metaBrand || null;

    // Image
    const ogImg = root.querySelector('meta[property="og:image"]')?.getAttribute('content');
    const image_url = jsonLd?.image_url || ogImg || null;

    const ingredients = this.extractIngredients(root);
    const nutrition = this.extractNutrition(root);

    return {
      name,
      brand,
      url: window.location.href,
      category: jsonLd?.category || 'general_food',
      ingredients_text: ingredients,
      nutrition,
      identifiers: this.extractIdentifiers(root),
      image_url
    };
  }

  getConfidence(): number {
    return 0.70;
  }
}
