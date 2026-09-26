from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    code: str = Field(..., description="Error code identifier, e.g. INVALID_REQUEST, VALIDATION_ERROR, NOT_FOUND")
    message: str = Field(..., description="Human-readable explanation of error")
    details: Dict[str, Any] = Field(default_factory=dict, description="Additional context or validation errors")
    request_id: Optional[str] = Field(None, description="Traceable unique request ID")


class ErrorResponse(BaseModel):
    error: ErrorDetail


class HealthResponse(BaseModel):
    status: str = "ok"
    database: str = "ok"
    rules_engine: str = "ok"
    version: str = "1.0.0"
