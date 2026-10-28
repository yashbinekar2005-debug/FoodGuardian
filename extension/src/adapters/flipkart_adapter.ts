import { SiteAdapter } from './site_adapter';
import { RawProductData, NutritionData, ProductIdentifiers } from '../types';
import { JsonLdExtractor } from '../extraction/jsonld_extractor';
import { DomExtractor } from '../extraction/dom_extractor';
import { ProductImageExtractor } from '../extraction/product_images';

export class FlipkartAdapter implements SiteAdapter {
  name = 'Flipkart Adapter';

  matches(url: string): boolean {
    return /(?:^|\/\/)(?:[^/]+\.)?flipkart\.com\//i.test(url) && /\/p\//i.test(url);
  }

  extractIdentifiers(root: Document): ProductIdentifiers {
    const productCode = window.location.pathname.match(/\/p\/(?:itm)?([a-z0-9]+)/i)?.[1] || null;
    return { gtin: null, asin: null, sku: productCode };
  }

  extractIngredients(root: Document): string | null {
    return DomExtractor.scanDomForIngredients(root) || JsonLdExtractor.extract(root)?.ingredients_text || null;
  }

  extractNutrition(root: Document): NutritionData | null {
    return DomExtractor.scanDomForNutrition(root) || JsonLdExtractor.extract(root)?.nutrition || null;
  }

  extractProduct(root: Document): RawProductData | null {
    const jsonLd = JsonLdExtractor.extract(root);
    const title = root.querySelector(
      'h1, [class*="B_NuCI"], [class*="VU-ZEz"], [data-testid*="product-title"], [class*="ProductTitle"]'
    )?.textContent?.trim();
    const metaTitle = root.querySelector('meta[property="og:title"]')?.getAttribute('content');
    const name = title || jsonLd?.name || metaTitle || document.title.replace(/\s*[-|]\s*Flipkart.*$/i, '').trim();
    if (!name || name.length < 3) return null;

    const preferredImage = jsonLd?.image_url || root.querySelector('meta[property="og:image"]')?.getAttribute('content');
    const imageUrls = ProductImageExtractor.collect(
      root,
      [
        'img[src*="flixcart.com"]',
        'img[data-src*="flixcart.com"]',
        'img[data-lazy-src*="flixcart.com"]',
        'img[srcset*="flixcart.com"]',
        '[class*="image-grid"] img',
        '[class*="ImageGrid"] img',
        '[class*="image-gallery"] img',
        '[class*="ImageGallery"] img',
        '[class*="ProductImage"] img',
        '[data-testid*="image"] img'
      ].join(','),
      preferredImage
    );
    const brand = root.querySelector('[class*="brand"], [class*="Brand"]')?.textContent?.trim()
      || jsonLd?.brand || null;

    return {
      name: name.replace(/\s+/g, ' ').trim(),
      brand: brand?.replace(/\s+/g, ' ').trim() || null,
      url: window.location.href,
      category: 'packaged_food',
      ingredients_text: this.extractIngredients(root),
      nutrition: this.extractNutrition(root),
      identifiers: this.extractIdentifiers(root),
      image_url: imageUrls[0] || preferredImage || null,
      image_urls: imageUrls
    };
  }

  getConfidence(): number {
    return 0.88;
  }
}
