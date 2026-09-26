import { RawProductData, NutritionData, ProductIdentifiers } from '../types';

export interface SiteAdapter {
  name: string;
  matches(url: string): boolean;
  extractProduct(root: Document): RawProductData | null;
  extractIngredients(root: Document): string | null;
  extractNutrition(root: Document): NutritionData | null;
  extractIdentifiers(root: Document): ProductIdentifiers;
  getConfidence(): number;
}
