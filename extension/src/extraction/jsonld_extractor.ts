import { RawProductData } from '../types';

export class JsonLdExtractor {
  static extract(doc: Document): Partial<RawProductData> | null {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    for (const script of Array.from(scripts)) {
      try {
        const text = script.textContent;
        if (!text) continue;
        const parsed = JSON.parse(text);
        const item = this.findProductObject(parsed);
        if (item) {
          const brandName = typeof item.brand === 'object' ? item.brand?.name : item.brand;
          const gtin = item.gtin13 || item.gtin12 || item.gtin8 || item.gtin || item.isbn || null;

          return {
            name: item.name || null,
            brand: brandName || null,
            category: item.category || null,
            image_url: Array.isArray(item.image) ? item.image[0] : (item.image?.url || item.image || null),
            identifiers: {
              gtin: gtin ? String(gtin) : null,
              sku: item.sku ? String(item.sku) : null
            },
            ingredients_text: item.ingredients || item.recipeIngredient || null
          };
        }
      } catch {
        // Skip unparseable scripts
      }
    }
    return null;
  }

  private static findProductObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return null;
    if (obj['@type'] === 'Product') return obj;

    if (Array.isArray(obj)) {
      for (const item of obj) {
        const found = this.findProductObject(item);
        if (found) return found;
      }
    } else if (obj['@graph'] && Array.isArray(obj['@graph'])) {
      for (const item of obj['@graph']) {
        const found = this.findProductObject(item);
        if (found) return found;
      }
    }
    return null;
  }
}
