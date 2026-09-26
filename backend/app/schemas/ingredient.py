from typing import List, Optional
from pydantic import BaseModel, Field


class NormalizedIngredient(BaseModel):
    name: str = Field(..., description="Canonical or parsed name of ingredient")
    code: Optional[str] = Field(None, description="Additive code e.g. 'INS 330' or 'E330'")
    type: str = Field(default="ingredient", description="functional category or 'ingredient' / 'additive'")
    is_additive: bool = Field(default=False, description="Whether this is an authorized/recognized food additive")
    confidence: float = Field(default=1.0, description="Match confidence between 0.0 and 1.0")
    raw_text: Optional[str] = Field(None, description="Original raw token from ingredient string")


class IngredientDetailResponse(BaseModel):
    id: str
    canonical_name: str
    aliases: List[str] = []
    category: Optional[str] = None
    additive_code: Optional[str] = None


class AdditiveDetailResponse(BaseModel):
    code: str
    ins_code: Optional[str] = None
    name: str
    functional_classes: List[str] = []
    jurisdictions: List[str] = ["IN", "EU"]
    source_reference: Optional[str] = None
    description: Optional[str] = None
