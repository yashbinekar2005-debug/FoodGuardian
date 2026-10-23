from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.schemas.product import ProductInput
from app.schemas.ingredient import NormalizedIngredient
from app.schemas.scoring import ScoreRating, ScoringFactor


class AnalyzeRequest(BaseModel):
    product: ProductInput
    jurisdictions: List[str] = Field(default=["IN", "EU"], description="Jurisdictions to evaluate against")
    rule_version: Optional[str] = Field(default="current", description="Regulatory rule version snapshot")


class AnalyzeSummary(BaseModel):
    ingredient_count: int = 0
    recognized_additives: int = 0
    unknown_ingredients: int = 0
    flags_count: int = 0


class EvidenceItem(BaseModel):
    type: str = Field(..., description="Evidence category: regulatory, nutrition, labelling")
    jurisdiction: Optional[str] = None
    source: str = Field(..., description="Official regulation title or publication")
    details: Optional[str] = None
    url: Optional[str] = None


class RuleMetadata(BaseModel):
    regulatory_version: str
    scoring_version: str


class AIPrediction(BaseModel):
    model_name: str = "llama3.2"
    final_verdict: str
    health_grade: str
    health_score: int
    processing_level: str
    key_concerns: List[str] = []
    key_positives: List[str] = []
    regulatory_duel_insight: str
    consumer_advice: str
    inferred_ingredients: Optional[str] = None


class AnalyzeResponse(BaseModel):
    analysis_id: str
    product: Dict[str, Any]
    rating: ScoreRating
    summary: AnalyzeSummary
    ingredients: List[NormalizedIngredient]
    additives: List[Dict[str, Any]]
    nutrition: Dict[str, Any]
    regulatory_comparison: Dict[str, Any]
    evidence: List[EvidenceItem]
    factors: List[ScoringFactor] = []
    rules: RuleMetadata
    ai_prediction: Optional[AIPrediction] = None
