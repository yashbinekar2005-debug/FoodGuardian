from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class RegulatoryRuleDetail(BaseModel):
    status: str = Field(..., description="Authorization status: authorized, limit_applies, condition_applies, not_authorized, unknown")
    food_category: str = Field(..., description="Food category scope e.g. 'biscuits', 'sauce', 'all'")
    conditions: Optional[str] = Field(None, description="Conditions of use under the regulation")
    maximum_level: Optional[str] = Field(None, description="Permitted maximum residue or usage level")
    maximum_level_unit: Optional[str] = Field(None, description="Unit e.g. 'mg/kg', 'GMP', 'quantum satis'")
    labelling_requirement: Optional[str] = Field(None, description="Mandatory advisory or warning statement")
    regulation: str = Field(..., description="Official title of regulation")
    regulation_number: Optional[str] = None
    version: str = Field(..., description="Rule snapshot or version identifier")
    source_url: Optional[str] = None
    source_document: Optional[str] = None


class RegulatoryJurisdictionStatus(BaseModel):
    status: str = Field(..., description="'matched', 'not_authorized', 'condition_applies', 'limit_applies', 'unregulated_or_unknown'")
    conditions: Optional[str] = None
    maximum_level: Optional[str] = None
    labelling: Optional[str] = None
    source: str
    rules: List[RegulatoryRuleDetail] = []


class RuleVersionResponse(BaseModel):
    regulatory_data_version: str = "2026-08"
    scoring_methodology_version: str = "1.0"
    api_version: str = "v1"
    last_updated: str = "2026-08-19"


class RegulationQueryResponse(BaseModel):
    jurisdiction: str
    subject: str
    code: Optional[str] = None
    rules: List[RegulatoryRuleDetail] = []
