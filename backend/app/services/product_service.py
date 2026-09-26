from typing import Optional
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.product import Product, ProductIdentifier
from app.schemas.product import ProductMatchRequest, ProductMatchResponse


class ProductService:
    @staticmethod
    async def match_product(session: AsyncSession, req: ProductMatchRequest) -> ProductMatchResponse:
        # 1. Match by GTIN barcode
        if req.gtin:
            clean_gtin = req.gtin.strip()
            stmt = select(ProductIdentifier).where(
                and_(
                    ProductIdentifier.identifier_type == "gtin",
                    ProductIdentifier.identifier_value == clean_gtin
                )
            )
            result = await session.execute(stmt)
            pid = result.scalar_one_or_none()
            if pid:
                return ProductMatchResponse(
                    matched=True,
                    product_id=str(pid.product_id),
                    match_method="gtin",
                    confidence=1.0
                )

        # 2. Match by exact URL
        if req.source_url:
            stmt = select(Product).where(Product.source_url == req.source_url.strip())
            result = await session.execute(stmt)
            prod = result.scalar_one_or_none()
            if prod:
                return ProductMatchResponse(
                    matched=True,
                    product_id=str(prod.id),
                    match_method="source_url",
                    confidence=0.95
                )

        # 3. Match by Brand + Name
        if req.name:
            clean_name = req.name.strip().lower()
            query = select(Product).where(func.lower(Product.name) == clean_name)
            if req.brand:
                query = query.where(func.lower(Product.brand) == req.brand.strip().lower())
            result = await session.execute(query)
            prod = result.scalar_one_or_none()
            if prod:
                return ProductMatchResponse(
                    matched=True,
                    product_id=str(prod.id),
                    match_method="brand_and_name",
                    confidence=0.88
                )

        return ProductMatchResponse(matched=False, confidence=0.0)
