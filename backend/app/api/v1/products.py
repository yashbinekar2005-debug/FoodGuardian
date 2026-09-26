from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.product import ProductMatchRequest, ProductMatchResponse
from app.services.product_service import ProductService

router = APIRouter(prefix="/product", tags=["Products"])


@router.post(
    "/match",
    response_model=ProductMatchResponse,
    status_code=status.HTTP_200_OK,
    summary="Match Product",
    description="Matches product against known database records via barcode GTIN, source URL, or brand & name."
)
async def match_product(
    request: ProductMatchRequest,
    db: AsyncSession = Depends(get_db)
) -> ProductMatchResponse:
    return await ProductService.match_product(session=db, req=request)
