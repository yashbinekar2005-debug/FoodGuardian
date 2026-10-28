import { SiteAdapter } from './site_adapter';
import { RawProductData, NutritionData, ProductIdentifiers } from '../types';
import { JsonLdExtractor } from '../extraction/jsonld_extractor';
import { DomExtractor } from '../extraction/dom_extractor';
import { ProductImageExtractor } from '../extraction/product_images';

export class AmazonAdapter implements SiteAdapter {
  name = 'Amazon India Adapter';

  matches(url: string): boolean {
    if (!/amazon\.(in|com|co\.uk|ae|sa)/i.test(url)) return false;
    // Be more permissive - match if it looks like a product page
    return /\/dp\/|\/gp\/product\/|\/gp\/aw\/d\/|\/d\/|\/product\/|\/sspa\/|\/hz\/|\/([A-Z0-9]{10})(?:[/?#]|$)/i.test(url) ||
           /\/[A-Z0-9]{10}(?:\/|\?|$)/.test(url) ||
           /product/i.test(url);
  }

  extractIdentifiers(root: Document): ProductIdentifiers {
    let asin: string | null = null;
    const asinInput = root.querySelector<HTMLInputElement>('#ASIN, input[name="ASIN"]');
    if (asinInput && asinInput.value) {
      asin = asinInput.value.trim();
    } else {
      const match = window.location.pathname.match(/\/(?:dp|gp\/product|gp\/aw\/d|product)\/([A-Z0-9]{10})/i) ||
                    window.location.pathname.match(/\/([A-Z0-9]{10})(?:[/?#]|$)/i);
      if (match) asin = match[1];
    }
    return { asin, gtin: null, sku: null };
  }

  extractIngredients(root: Document): string | null {
    // Try DOM extraction first
    let result = DomExtractor.scanDomForIngredients(root);
    if (result) return result;
    // Also try JSON-LD
    const jsonLd = JsonLdExtractor.extract(root);
    if (jsonLd?.ingredients_text) return jsonLd.ingredients_text;
    return null;
  }

  extractNutrition(root: Document): NutritionData | null {
    let result = DomExtractor.scanDomForNutrition(root);
    if (result) return result;
    const jsonLd = JsonLdExtractor.extract(root);
    if (jsonLd?.nutrition) return jsonLd.nutrition;
    return null;
  }

  extractProduct(root: Document): RawProductData | null {
    // Attempt JSON-LD first
    const jsonLd = JsonLdExtractor.extract(root);

    // Title with multiple fallbacks
    const titleEl = root.querySelector('#productTitle, #title, h1.a-size-large, h1#title, span#productTitle, h1[data-automation-id="product-title"], .product-title-word-break, #titleSection h1');
    const ogTitle = root.querySelector('meta[property="og:title"]')?.getAttribute('content');
    const twitterTitle = root.querySelector('meta[name="twitter:title"]')?.getAttribute('content');
    const rawDocTitle = typeof document !== 'undefined'
      ? document.title.replace(/^Amazon\.[a-z.]+\s*[:\-]\s*/i, '').replace(/\s*[:\-]\s*Amazon\.[a-z.]+$/i, '').trim()
      : '';
    
    let name = titleEl?.textContent?.trim() || jsonLd?.name || ogTitle || twitterTitle || (rawDocTitle && !rawDocTitle.toLowerCase().includes('page not found') && rawDocTitle.length > 3 ? rawDocTitle : null);
    if (!name) return null;
    // Clean up common Amazon title suffixes
    name = name.replace(/\s*[:|\-]\s*Amazon\.[a-z.]+.*$/i, '').trim();
    name = name.replace(/\s+/g, ' ').trim();
    if (name.length < 3) return null;

    // Brand
    const brandEl = root.querySelector('#bylineInfo, #brand, tr.po-brand td.po-break-word, a#bylineInfo, .po-brand .a-span9, #brand a, [data-brand-name]');
    let brand = brandEl?.textContent?.replace(/Brand:\s*|Visit the\s*|Store|from\s+/gi, '').trim() ||
                root.querySelector('meta[property="product:brand"], meta[name="brand"]')?.getAttribute('content') ||
                jsonLd?.brand || null;
    if (brand) brand = brand.replace(/\s+/g, ' ').trim();

    // Category
    const breadcrumb = root.querySelector('#wayfinding-breadcrumbs_container, #breadcrumb');
    const category = breadcrumb?.textContent?.replace(/\s+/g, ' ').trim() || jsonLd?.category || 'food';

    const ingredients = this.extractIngredients(root);
    const nutrition = this.extractNutrition(root);
    const identifiers = this.extractIdentifiers(root);

    const preferredImage = jsonLd?.image_url
      || root.querySelector('#landingImage, #imgBlkFront, .imgTagWrapper img')?.getAttribute('src')
      || root.querySelector('meta[property="og:image"]')?.getAttribute('content')
      || null;
    const imageUrls = ProductImageExtractor.collect(
      root,
      '#landingImage, #imgBlkFront, #altImages img, #imageBlock img, .imgTagWrapper img',
      preferredImage
    );

    return {
      name,
      brand,
      url: typeof window !== 'undefined' ? window.location.href : null,
      category,
      ingredients_text: ingredients,
      nutrition,
      identifiers,
      package_size: null,
      serving_size: null,
      image_url: imageUrls[0] || preferredImage,
      image_urls: imageUrls
    };
  }

  getConfidence(): number {
    return 0.90;
  }
}
