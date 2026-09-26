from fastapi import APIRouter, status
from app.core.config import settings
from app.schemas.regulatory import RuleVersionResponse

router = APIRouter(prefix="/rules", tags=["Rules"])


@router.get(
    "/version",
    response_model=RuleVersionResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Active Rule Versions",
    description="Returns current active regulatory knowledge snapshot and scoring methodology version identifiers."
)
async def get_rule_versions() -> RuleVersionResponse:
    return RuleVersionResponse(
        regulatory_data_version=settings.REGULATORY_DATA_VERSION,
        scoring_methodology_version=settings.SCORING_METHODOLOGY_VERSION,
        api_version=settings.API_VERSION,
        last_updated=settings.LAST_REGULATORY_UPDATE
    )
