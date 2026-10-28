export interface NutritionData {
  energy_kcal_100g?: number | null;
  fat_g_100g?: number | null;
  saturated_fat_g_100g?: number | null;
  carbohydrate_g_100g?: number | null;
  sugars_g_100g?: number | null;
  protein_g_100g?: number | null;
  fiber_g_100g?: number | null;
  sodium_mg_100g?: number | null;
  salt_g_100g?: number | null;
  serving_size?: string | null;
}

export interface ProductIdentifiers {
  gtin?: string | null;
  asin?: string | null;
  sku?: string | null;
}

export interface RawProductData {
  name: string;
  brand?: string | null;
  url?: string | null;
  category?: string | null;
  ingredients_text?: string | null;
  nutrition?: NutritionData | null;
  identifiers?: ProductIdentifiers | null;
  package_size?: string | null;
  serving_size?: string | null;
  image_url?: string | null;
  image_urls?: string[];
}

export interface NormalizedIngredient {
  name: string;
  code?: string | null;
  type: string;
  is_additive: boolean;
  confidence: number;
  raw_text?: string | null;
}

export interface AdditiveInsight {
  name: string;
  code: string;
  ins_code?: string | null;
  functional_class: string;
  functional_classes?: string | null;
  description?: string | null;
  regulatory_status: {
    india?: string;
    eu?: string;
  };
  comparison_summary?: string;
}

export interface RegulatoryRuleDetail {
  status: string;
  food_category: string;
  conditions?: string | null;
  maximum_level?: string | null;
  maximum_level_unit?: string | null;
  labelling_requirement?: string | null;
  regulation: string;
  regulation_number?: string | null;
  version: string;
  source_url?: string | null;
  source_document?: string | null;
}

export interface JurisdictionComparison {
  jurisdiction: string;
  status: string;
  food_category: string;
  maximum_level?: string | null;
  conditions?: string | null;
  labelling?: string | null;
  source: string;
  source_url?: string | null;
  source_document?: string | null;
  rules: RegulatoryRuleDetail[];
}

export interface ScoringFactor {
  factor_id: string;
  factor_name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  score_delta: number;
  reason: string;
  evidence?: string | null;
}

export interface ScoreRating {
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'NR';
  score: number;
  confidence: number;
  rating_available: boolean;
}

export interface AnalysisSummary {
  ingredient_count: number;
  recognized_additives: number;
  unknown_ingredients: number;
  flags_count: number;
}

export interface EvidenceItem {
  type: string;
  jurisdiction?: string | null;
  source: string;
  details?: string | null;
  url?: string | null;
}

export interface AnalyzeResponse {
  analysis_id: string;
  product: {
    name: string;
    normalized_name: string;
    brand?: string | null;
    category?: string | null;
    url?: string | null;
    identifiers?: ProductIdentifiers | null;
  };
  rating: ScoreRating;
  summary: AnalysisSummary;
  ingredients: NormalizedIngredient[];
  additives: AdditiveInsight[];
  nutrition: {
    available: boolean;
    normalized: Record<string, number>;
    flags: string[];
    completeness_score: number;
  };
  regulatory_comparison: {
    india: JurisdictionComparison[];
    eu: JurisdictionComparison[];
  };
  evidence: EvidenceItem[];
  factors: ScoringFactor[];
  rules: {
    regulatory_version: string;
    scoring_version: string;
  };
}

export interface ExtensionSettings {
  enabled: boolean;
  apiUrl: string;
  preferredJurisdiction: 'both' | 'IN' | 'EU';
  displayMode: 'compact' | 'expanded';
  autoAnalyze: boolean;
}
