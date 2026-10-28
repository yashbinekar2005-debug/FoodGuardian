from typing import Optional
from pydantic import BaseModel, Field


class ScoreRating(BaseModel):
    grade: str = Field(..., description="FoodGuardian rating grade from A to F, or NR when ingredient data is missing")
    score: float = Field(..., description="Deterministic internal score from 0 to 100; 0 when not rateable")
    confidence: float = Field(..., description="Data confidence score from 0.0 to 1.0")
    rating_available: bool = Field(True, description="Whether sufficient ingredient data exists to assign a rating")


class ScoringFactor(BaseModel):
    factor_id: str
    factor_name: str
    impact: str = Field(..., description="'positive', 'negative', or 'neutral'")
    weight: float
    score_delta: float
    reason: str
    evidence: Optional[str] = None
