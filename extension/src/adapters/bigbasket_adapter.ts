import { SiteAdapter } from './site_adapter';
import { RawProductData, NutritionData, ProductIdentifiers } from '../types';
import { JsonLdExtractor } from '../extraction/jsonld_extractor';
import { DomExtractor } from '../extraction/dom_extractor';

export class BigBasketAdapter implements SiteAdapter {
  name = 'BigBasket Adapter';

  matches(url: string): boolean {
    return /bigbasket\.com\/pd\//i.test(url);
  }

  extractIdentifiers(root: Document): ProductIdentifiers {
    const skuMatch = window.location.pathname.match(/\/pd\/(\d+)\//i);
    const sku = skuMatch ? skuMatch[1] : null;
    return { gtin: null, asin: null, sku };
  }

  extractIngredients(root: Document): string | null {
    const sections = root.querySelectorAll('div[class*="PackagedFoodDetails"], div[data-qa="ingredients"], section');
    for (const sec of Array.from(sections)) {
      const text = sec.textContent || '';
      if (/ingredients\s*[:\-]/i.test(text)) {
        const extracted = DomExtractor.extractIngredientsFromText(text);
        if (extracted) return extracted;
      }
    }
    return null;
  }

  extractNutrition(root: Document): NutritionData | null {
    const table = root.querySelector('table[class*="Nutrition"], div[class*="NutritionalInfo"]');
    if (table && table.textContent) {
      return DomExtractor.parseNutritionFromText(table.textContent);
    }
    return null;
  }

  extractProduct(root: Document): RawProductData | null {
    const jsonLd = JsonLdExtractor.extract(root);

    const titleEl = root.querySelector('h1[class*="Description___StyledH"], h1');
    const name = titleEl?.textContent?.trim() || jsonLd?.name || null;
    if (!name) return null;

    const brandEl = root.querySelector('a[class*="BrandLink"], div[class*="BrandName"]');
    const brand = brandEl?.textContent?.trim() || jsonLd?.brand || null;

    const ingredients = this.extractIngredients(root) || jsonLd?.ingredients_text || null;
    const nutrition = this.extractNutrition(root) || jsonLd?.nutrition || null;

    return {
      name,
      brand,
      url: window.location.href,
      category: 'grocery',
      ingredients_text: ingredients,
      nutrition,
      identifiers: this.extractIdentifiers(root),
      image_url: jsonLd?.image_url || root.querySelector('img[class*="Image___StyledImg"]')?.getAttribute('src') || null
    };
  }

  getConfidence(): number {
    return 0.88;
  }
}
