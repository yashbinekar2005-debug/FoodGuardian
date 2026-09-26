from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from app.core.database import get_db
from app.models.ingredient import Ingredient, IngredientAlias
from app.schemas.ingredient import IngredientDetailResponse

router = APIRouter(prefix="/ingredients", tags=["Ingredients"])


@router.get(
    "/{id}",
    response_model=IngredientDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Ingredient Details",
    description="Retrieves canonical ingredient information and known aliases by UUID or canonical name."
)
async def get_ingredient(
    id: str,
    db: AsyncSession = Depends(get_db)
) -> IngredientDetailResponse:
    clean_id = id.strip()
    
    # Try finding by canonical name or ID
    stmt = (
        select(Ingredient)
        .where(
            or_(
                func.lower(Ingredient.canonical_name) == clean_id.lower(),
                Ingredient.additive_code == clean_id.upper()
            )
        )
    )
    result = await db.execute(stmt)
    ing = result.scalar_one_or_none()

    if not ing:
        # Check alias match
        alias_stmt = (
            select(Ingredient)
            .join(IngredientAlias, Ingredient.id == IngredientAlias.ingredient_id)
            .where(func.lower(IngredientAlias.alias) == clean_id.lower())
        )
        alias_res = await db.execute(alias_stmt)
        ing = alias_res.scalar_one_or_none()

    if not ing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ingredient '{clean_id}' was not found in knowledge base."
        )

    # Fetch aliases
    aliases_stmt = select(IngredientAlias.alias).where(IngredientAlias.ingredient_id == ing.id)
    aliases_res = await db.execute(aliases_stmt)
    aliases = [r[0] for r in aliases_res.all()]

    return IngredientDetailResponse(
        id=str(ing.id),
        canonical_name=ing.canonical_name,
        aliases=aliases,
        category=ing.category,
        additive_code=ing.additive_code
    )
