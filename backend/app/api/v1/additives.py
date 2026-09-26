from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.ingredient import AdditiveDetailResponse
from app.services.additive_service import AdditiveService

router = APIRouter(prefix="/additives", tags=["Additives"])


@router.get(
    "/{code}",
    response_model=AdditiveDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Additive Details",
    description="Retrieves additive metadata including INS/E-number code, functional classes, and source reference."
)
async def get_additive(
    code: str,
    db: AsyncSession = Depends(get_db)
) -> AdditiveDetailResponse:
    additive = await AdditiveService.get_by_code(db, code)
    if not additive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Additive with code '{code}' was not found in knowledge base."
        )

    functional_classes = [c.strip() for c in additive.functional_classes.split(",") if c.strip()]

    return AdditiveDetailResponse(
        code=additive.code,
        ins_code=additive.ins_code,
        name=additive.name,
        functional_classes=functional_classes,
        jurisdictions=["IN", "EU"],
        source_reference=additive.source_reference,
        description=additive.description
    )
