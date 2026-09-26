import { describe, it, expect } from 'vitest';
import { AmazonAdapter } from '../src/adapters/amazon_adapter';
import { BigBasketAdapter } from '../src/adapters/bigbasket_adapter';
import { BlinkitAdapter } from '../src/adapters/blinkit_adapter';
import { GenericAdapter } from '../src/adapters/generic_adapter';
import { AdapterRegistry } from '../src/adapters/adapter_registry';
import { DomExtractor } from '../src/extraction/dom_extractor';

describe('Site Adapters URL Matching', () => {
  it('AmazonAdapter matches Amazon India product URLs', () => {
    const adapter = new AmazonAdapter();
    expect(adapter.matches('https://www.amazon.in/dp/B07T4RNZ7Q')).toBe(true);
    expect(adapter.matches('https://www.amazon.in/Sunfeast-Dark-Fantasy-Choco-Fills/dp/B00TN9M988/ref=sr_1_1')).toBe(true);
    expect(adapter.matches('https://www.amazon.in/gp/product/B00TN9M988')).toBe(true);
    expect(adapter.matches('https://www.amazon.in/s?k=biscuits')).toBe(false);
  });

  it('BigBasketAdapter matches BigBasket product URLs', () => {
    const adapter = new BigBasketAdapter();
    expect(adapter.matches('https://www.bigbasket.com/pd/10001234/parle-g-glucose-biscuits-800g/')).toBe(true);
    expect(adapter.matches('https://www.bigbasket.com/cl/bakery-cakes-dairy/')).toBe(false);
  });

  it('BlinkitAdapter matches Blinkit product URLs', () => {
    const adapter = new BlinkitAdapter();
    expect(adapter.matches('https://blinkit.com/prn/maggi-2-minute-instant-noodles/prid/12345')).toBe(true);
  });

  it('AdapterRegistry returns specific adapter or fallback', () => {
    const amazon = AdapterRegistry.getAdapterForUrl('https://www.amazon.in/dp/B07T4RNZ7Q');
    expect(amazon instanceof AmazonAdapter).toBe(true);

    const bb = AdapterRegistry.getAdapterForUrl('https://www.bigbasket.com/pd/10001234/');
    expect(bb instanceof BigBasketAdapter).toBe(true);

    const fallback = AdapterRegistry.getAdapterForUrl('https://otherstore.example.com/product/123');
    expect(fallback instanceof GenericAdapter).toBe(true);
  });
});

describe('DomExtractor Nutrition Extraction', () => {
  it('parses energy, sugar, fat, and sodium from unstructured text', () => {
    const sampleText = 'Per 100g: Energy 480 kcal, Total Fat 20g, Saturated Fat 8g, Total Sugars 18g, Protein 7g, Dietary Fiber 4g, Sodium 350mg';
    const parsed = DomExtractor.parseNutritionFromText(sampleText);
    expect(parsed).not.toBeNull();
    expect(parsed?.energy_kcal_100g).toBe(480);
    expect(parsed?.fat_g_100g).toBe(20);
    expect(parsed?.saturated_fat_g_100g).toBe(8);
    expect(parsed?.sugars_g_100g).toBe(18);
    expect(parsed?.protein_g_100g).toBe(7);
    expect(parsed?.fiber_g_100g).toBe(4);
    expect(parsed?.sodium_mg_100g).toBe(350);
  });

  it('extracts ingredient list from text containing label', () => {
    const raw = 'Product Details: Ingredients: Wheat flour, sugar, palm oil, salt, INS 322.';
    const ing = DomExtractor.extractIngredientsFromText(raw);
    expect(ing).toBe('Wheat flour, sugar, palm oil, salt, INS 322');
  });
});
