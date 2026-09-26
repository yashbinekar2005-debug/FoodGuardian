from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import verify_token_optional
from app.schemas.analyze import AnalyzeRequest, AnalyzeResponse
from app.services.analysis_service import AnalysisService

router = APIRouter(prefix="/analyze", tags=["Analysis"])


@router.post(
    "",
    response_model=AnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Packaged-Food Product",
    description="Analyzes product ingredients, normalizes additives, performs nutrition profiling, compares India vs EU regulations, and calculates the FoodGuardian A-F decision-support rating."
)
async def analyze_product(
    request: AnalyzeRequest,
    db: AsyncSession = Depends(get_db),
    auth: dict = Depends(verify_token_optional)
) -> AnalyzeResponse:
    return await AnalysisService.analyze_product(session=db, request=request)
