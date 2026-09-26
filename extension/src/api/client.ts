import { RawProductData, AnalyzeResponse, ExtensionSettings } from '../types';
import { getSettings } from '../utils/storage';
import { logger } from '../utils/logger';

export class FoodGuardianApiClient {
  private static async getBaseUrl(): Promise<string> {
    const settings = await getSettings();
    return settings.apiUrl.replace(/\/+$/, '');
  }

  static async analyzeProduct(product: RawProductData, jurisdictions: string[] = ['IN', 'EU']): Promise<AnalyzeResponse> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}/analyze`;

    const payload = {
      product: {
        name: product.name,
        brand: product.brand,
        url: product.url,
        category: product.category,
        ingredients_text: product.ingredients_text,
        nutrition: product.nutrition,
        identifiers: product.identifiers,
        package_size: product.package_size,
        serving_size: product.serving_size
      },
      jurisdictions,
      rule_version: 'current'
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-App': 'FoodGuardian-Extension/1.0.0'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const msg = errorBody.error?.message || `API error (${response.status})`;
        throw new Error(msg);
      }

      const data: AnalyzeResponse = await response.json();
      return data;
    } catch (err: any) {
      logger.error('Failed to communicate with FoodGuardian backend:', err);
      throw err;
    }
  }

  static async checkHealth(): Promise<boolean> {
    try {
      const baseUrl = await this.getBaseUrl();
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) {
        const data = await response.json();
        return data.status === 'ok';
      }
      return false;
    } catch {
      return false;
    }
  }
}
