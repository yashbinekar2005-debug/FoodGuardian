import { SiteAdapter } from './site_adapter';
import { RawProductData, NutritionData, ProductIdentifiers } from '../types';
import { JsonLdExtractor } from '../extraction/jsonld_extractor';
import { DomExtractor } from '../extraction/dom_extractor';
import { ProductImageExtractor } from '../extraction/product_images';

export class BlinkitAdapter implements SiteAdapter {
  name = 'Blinkit Adapter';

  matches(url: string): boolean {
    return /blinkit\.com\/(?:prn|prid|p|product)\//i.test(url) || /blinkit\.com/i.test(url);
  }

  extractIdentifiers(root: Document): ProductIdentifiers {
    const match = window.location.pathname.match(/\/(?:prn\/[^/]+\/prid|prid|p|product)\/(\d+)/i);
    const sku = match ? match[1] : null;
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

    const titleEl = root.querySelector('h1, div[class*="ProductTitle"], div[class*="product-name"], div[class*="Header__Title"], [data-test-id="product-title"], h2');
    const ogTitle = root.querySelector('meta[property="og:title"]')?.getAttribute('content');
    const rawDocTitle = typeof document !== 'undefined' ? document.title.replace(/\s*[-|]\s*blinkit.*$/i, '').trim() : '';
    let name = titleEl?.textContent?.trim() || jsonLd?.name || ogTitle || (rawDocTitle && !rawDocTitle.includes('Online Grocery') ? rawDocTitle : null);
    if (!name) return null;
    name = name.replace(/\s+/g, ' ').trim();

    const brand = jsonLd?.brand || root.querySelector('[class*="Brand"], [data-test-id="brand"]')?.textContent?.trim() || null;
    const ingredients = this.extractIngredients(root) || jsonLd?.ingredients_text || null;
    const nutrition = this.extractNutrition(root) || jsonLd?.nutrition || null;

    const preferredImage = jsonLd?.image_url
      || root.querySelector('img[class*="Image"], img[alt*="product"]')?.getAttribute('src')
      || null;
    const imageUrls = ProductImageExtractor.collect(
      root,
      'img[class*="Image"], img[alt*="product"], [class*="ProductImage"] img',
      preferredImage
    );

    return {
      name,
      brand,
      url: window.location.href,
      category: 'packaged_food',
      ingredients_text: ingredients,
      nutrition,
      identifiers: this.extractIdentifiers(root),
      image_url: imageUrls[0] || preferredImage,
      image_urls: imageUrls
    };
  }

  getConfidence(): number {
    return 0.85;
  }
}
