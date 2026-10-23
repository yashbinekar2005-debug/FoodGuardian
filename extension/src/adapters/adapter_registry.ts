import { SiteAdapter } from './site_adapter';
import { AmazonAdapter } from './amazon_adapter';
import { BigBasketAdapter } from './bigbasket_adapter';
import { BlinkitAdapter } from './blinkit_adapter';
import { GenericAdapter } from './generic_adapter';

export class AdapterRegistry {
  private static adapters: SiteAdapter[] = [
    new AmazonAdapter(),
    new BigBasketAdapter(),
    new BlinkitAdapter(),
    new GenericAdapter() // Always last as fallback
  ];

  static getAdapterForUrl(url: string): SiteAdapter {
    for (const adapter of this.adapters) {
      if (adapter.matches(url)) {
        return adapter;
      }
    }
    return this.adapters[this.adapters.length - 1];
  }

  static getFallbackAdapter(): SiteAdapter {
    return this.adapters[this.adapters.length - 1];
  }
}
