import { SiteAdapter } from './site_adapter';
import { RawProductData, NutritionData, ProductIdentifiers } from '../types';
import { JsonLdExtractor } from '../extraction/jsonld_extractor';
import { DomExtractor } from '../extraction/dom_extractor';

export class AmazonAdapter implements SiteAdapter {
  name = 'Amazon India Adapter';

  matches(url: string): boolean {
    return /amazon\.(in|com)/i.test(url) && (/\/dp\/|\/gp\/product\//i.test(url));
  }

  extractIdentifiers(root: Document): ProductIdentifiers {
    let asin: string | null = null;
    const asinInput = root.querySelector<HTMLInputElement>('#ASIN, input[name="ASIN"]');
    if (asinInput && asinInput.value) {
      asin = asinInput.value.trim();
    } else {
      const match = window.location.pathname.match(/\/dp\/([A-Z0-9]{10})/i);
      if (match) asin = match[1];
    }
    return { asin, gtin: null, sku: null };
  }

  extractIngredients(root: Document): string | null {
    // 1. Direct ingredient container
    const nicContainer = root.querySelector('#nic-ingredients-content, #ingredients-content, [data-feature-name="ingredients"]');
    if (nicContainer && nicContainer.textContent) {
      return nicContainer.textContent.trim();
    }

    // 2. Important information block
    const importantInfo = root.querySelectorAll('#important-information .content, #importantInformation .a-section');
    for (const el of Array.from(importantInfo)) {
      const text = el.textContent || '';
      if (/ingredients\s*[:\-]/i.test(text)) {
        const extracted = DomExtractor.extractIngredientsFromText(text);
        if (extracted) return extracted;
      }
    }

    // 3. Technical specifications table
    const tableRows = root.querySelectorAll('#productDetails_techSpec_section_1 tr, #technicalSpecifications_section_1 tr');
    for (const row of Array.from(tableRows)) {
      const th = row.querySelector('th')?.textContent || '';
      if (/ingredient/i.test(th)) {
        return row.querySelector('td')?.textContent?.trim() || null;
      }
    }

    return null;
  }

  extractNutrition(root: Document): NutritionData | null {
    // Search for nutrition facts table or specification block
    const fullText = root.querySelector('#important-information, #productDetails_feature_div, #detailBullets_feature_div')?.textContent || '';
    return DomExtractor.parseNutritionFromText(fullText);
  }

  extractProduct(root: Document): RawProductData | null {
    // Attempt JSON-LD first
    const jsonLd = JsonLdExtractor.extract(root);

    // Title
    const titleEl = root.querySelector('#productTitle, #title, h1.a-size-large');
    const name = titleEl?.textContent?.trim() || jsonLd?.name || null;
    if (!name) return null;

    // Brand
    const brandEl = root.querySelector('#bylineInfo, #brand, tr.po-brand td.po-break-word');
    let brand = brandEl?.textContent?.replace(/Brand:\s*|Visit the\s*|Store/gi, '').trim() || jsonLd?.brand || null;

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
      image_url: jsonLd?.image_url || root.querySelector('#landingImage')?.getAttribute('src') || null
    };
  }

  getConfidence(): number {
    return 0.90;
  }
}
