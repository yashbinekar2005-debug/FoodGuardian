import { SiteAdapter } from './site_adapter';
import { RawProductData, NutritionData, ProductIdentifiers } from '../types';
import { JsonLdExtractor } from '../extraction/jsonld_extractor';
import { DomExtractor } from '../extraction/dom_extractor';

export class BigBasketAdapter implements SiteAdapter {
  name = 'BigBasket Adapter';

  matches(url: string): boolean {
    return /bigbasket\.com\/(?:pd|ps|p)\//i.test(url) || /bigbasket\.com\/.*\/pd\//i.test(url);
  }

  extractIdentifiers(root: Document): ProductIdentifiers {
    const skuMatch = window.location.pathname.match(/\/(?:pd|ps|p)\/(\d+)/i);
    const sku = skuMatch ? skuMatch[1] : null;
    return { gtin: null, asin: null, sku };
  }

  extractIngredients(root: Document): string | null {
    return DomExtractor.scanDomForIngredients(root);
  }

  extractNutrition(root: Document): NutritionData | null {
    return DomExtractor.scanDomForNutrition(root);
  }

  extractProduct(root: Document): RawProductData | null {
    const jsonLd = JsonLdExtractor.extract(root);

    const titleEl = root.querySelector('h1[class*="Description___StyledH"], h1, [data-qa="product-title"], div[class*="ProductTitle"], [class*="product-name"]');
    const ogTitle = root.querySelector('meta[property="og:title"]')?.getAttribute('content');
    const rawDocTitle = typeof document !== 'undefined' ? document.title.replace(/\s*[-|]\s*bigbasket.*$/i, '').trim() : '';
    let name = titleEl?.textContent?.trim() || jsonLd?.name || ogTitle || (rawDocTitle && !rawDocTitle.includes('Online Grocery') ? rawDocTitle : null);
    if (!name) return null;
    name = name.replace(/\s+/g, ' ').trim();

    const brandEl = root.querySelector('a[class*="BrandLink"], div[class*="BrandName"], [data-qa="brand-name"]');
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
      image_url: jsonLd?.image_url || root.querySelector('img[class*="Image___StyledImg"], [data-qa="product-image"] img')?.getAttribute('src') || null
    };
  }

  getConfidence(): number {
    return 0.88;
  }
}
