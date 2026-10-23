import { SiteAdapter } from './site_adapter';
import { RawProductData, NutritionData, ProductIdentifiers } from '../types';
import { JsonLdExtractor } from '../extraction/jsonld_extractor';
import { DomExtractor } from '../extraction/dom_extractor';

export class AmazonAdapter implements SiteAdapter {
  name = 'Amazon India Adapter';

  matches(url: string): boolean {
    return /amazon\.(in|com|co\.uk)/i.test(url) && (
      /\/dp\/|\/gp\/product\/|\/gp\/aw\/d\/|\/d\/|\/product\//i.test(url) ||
      /\/([A-Z0-9]{10})(?:[/?#]|$)/i.test(url)
    );
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
    return DomExtractor.scanDomForIngredients(root);
  }

  extractNutrition(root: Document): NutritionData | null {
    return DomExtractor.scanDomForNutrition(root);
  }

  extractProduct(root: Document): RawProductData | null {
    // Attempt JSON-LD first
    const jsonLd = JsonLdExtractor.extract(root);

    // Title with multiple fallbacks
    const titleEl = root.querySelector('#productTitle, #title, h1.a-size-large, h1#title, span#productTitle, h1');
    const ogTitle = root.querySelector('meta[property="og:title"]')?.getAttribute('content');
    const rawDocTitle = typeof document !== 'undefined'
      ? document.title.replace(/^Amazon\.[a-z.]+\s*[:\-]\s*/i, '').replace(/\s*[:\-]\s*Amazon\.[a-z.]+$/i, '').trim()
      : '';
    
    let name = titleEl?.textContent?.trim() || jsonLd?.name || ogTitle || (rawDocTitle && !rawDocTitle.includes('Page Not Found') ? rawDocTitle : null);
    if (!name) return null;
    name = name.replace(/\s+/g, ' ').trim();

    // Brand
    const brandEl = root.querySelector('#bylineInfo, #brand, tr.po-brand td.po-break-word, a#bylineInfo, .po-brand .a-span9');
    let brand = brandEl?.textContent?.replace(/Brand:\s*|Visit the\s*|Store/gi, '').trim() ||
                root.querySelector('meta[property="product:brand"]')?.getAttribute('content') ||
                jsonLd?.brand || null;

    // Category
    const breadcrumb = root.querySelector('#wayfinding-breadcrumbs_container');
    const category = breadcrumb?.textContent?.replace(/\s+/g, ' ').trim() || jsonLd?.category || 'food';

    const ingredients = this.extractIngredients(root) || jsonLd?.ingredients_text || null;
    const nutrition = this.extractNutrition(root) || jsonLd?.nutrition || null;
    const identifiers = this.extractIdentifiers(root);

    return {
      name,
      brand,
      url: window.location.href,
      category,
      ingredients_text: ingredients,
      nutrition,
      identifiers,
      package_size: null,
      serving_size: null,
      image_url: jsonLd?.image_url || root.querySelector('#landingImage, #imgBlkFront')?.getAttribute('src') || null
    };
  }

  getConfidence(): number {
    return 0.90;
  }
}
