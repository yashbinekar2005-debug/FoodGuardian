import asyncio
import logging
from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine, Base
from app.models import (
    Jurisdiction, Source, RegulatoryRule, RuleVersion,
    ScoringMethodology, Additive, AdditiveAlias,
    Ingredient, IngredientAlias, Product, ProductIdentifier
)
from app.db.seed_data import (
    JURISDICTIONS, SOURCES, RULE_VERSIONS,
    SCORING_METHODOLOGIES, ADDITIVES, REGULATORY_RULES
)

logger = logging.getLogger("foodguardian.seed")
logging.basicConfig(level=logging.INFO)


async def seed_database():
    logger.info("Initializing database schema if not present...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # 1. Jurisdictions
        for j_data in JURISDICTIONS:
            existing = await session.get(Jurisdiction, j_data["id"])
            if not existing:
                session.add(Jurisdiction(**j_data))
                logger.info(f"Seeded jurisdiction: {j_data['id']}")
        await session.flush()

        # 2. Sources
        for s_data in SOURCES:
            stmt = select(Source).where(Source.id == s_data["id"])
            result = await session.execute(stmt)
            if not result.scalar_one_or_none():
                session.add(Source(**s_data))
                logger.info(f"Seeded source: {s_data['short_title']}")
        await session.flush()

        # 3. Rule Versions
        for rv_data in RULE_VERSIONS:
            stmt = select(RuleVersion).where(RuleVersion.version_code == rv_data["version_code"])
            result = await session.execute(stmt)
            if not result.scalar_one_or_none():
                session.add(RuleVersion(**rv_data))
                logger.info(f"Seeded rule version: {rv_data['version_code']}")
        await session.flush()

        # 4. Scoring Methodologies
        for sm_data in SCORING_METHODOLOGIES:
            stmt = select(ScoringMethodology).where(ScoringMethodology.version == sm_data["version"])
            result = await session.execute(stmt)
            if not result.scalar_one_or_none():
                session.add(ScoringMethodology(**sm_data))
                logger.info(f"Seeded scoring methodology: {sm_data['version']}")
        await session.flush()

        # 5. Additives & Aliases & canonical Ingredients
        for add_data in ADDITIVES:
            aliases = add_data.pop("aliases", [])
            stmt = select(Additive).where(Additive.code == add_data["code"])
            result = await session.execute(stmt)
            additive = result.scalar_one_or_none()
            if not additive:
                additive = Additive(**add_data)
                session.add(additive)
                await session.flush()
                logger.info(f"Seeded additive: {additive.code} ({additive.name})")

                # Add additive aliases
                for alias_str in aliases:
                    alias_obj = AdditiveAlias(additive_id=additive.id, alias=alias_str.lower().strip())
                    session.add(alias_obj)

                # Also add matching canonical Ingredient record
                ing_stmt = select(Ingredient).where(Ingredient.canonical_name == additive.name.lower())
                ing_res = await session.execute(ing_stmt)
                ingredient = ing_res.scalar_one_or_none()
                if not ingredient:
                    ingredient = Ingredient(
                        canonical_name=additive.name.lower(),
                        category="food_additive",
                        description=additive.description,
                        is_additive=True,
                        additive_code=additive.code
                    )
                    session.add(ingredient)
                    await session.flush()
                    for alias_str in aliases:
                        ing_alias = IngredientAlias(ingredient_id=ingredient.id, alias=alias_str.lower().strip())
                        session.add(ing_alias)
        await session.flush()

        # 6. Regulatory Rules
        for r_data in REGULATORY_RULES:
            stmt = select(RegulatoryRule).where(
                RegulatoryRule.jurisdiction_id == r_data["jurisdiction_id"],
                RegulatoryRule.substance_id == r_data["substance_id"],
                RegulatoryRule.food_category == r_data["food_category"],
                RegulatoryRule.version == r_data["version"]
            )
            result = await session.execute(stmt)
            if not result.scalar_one_or_none():
                session.add(RegulatoryRule(**r_data))
                logger.info(f"Seeded regulatory rule: {r_data['jurisdiction_id']} - {r_data['substance_id']} ({r_data['food_category']})")
        await session.flush()

        # 7. Seed Sample Verified Product for E2E testing
        sample_gtin = "8901234567890"
        stmt = select(ProductIdentifier).where(
            ProductIdentifier.identifier_type == "gtin",
            ProductIdentifier.identifier_value == sample_gtin
        )
        existing_pid = (await session.execute(stmt)).scalar_one_or_none()
        if not existing_pid:
            sample_product = Product(
                name="Example Biscuit",
                brand="Example Foods",
                category="biscuits",
                description="Classic digestive biscuits with wheat flour and dietary fiber",
                image_url="https://images.example.com/biscuit.jpg",
                package_size="200g",
                serving_size="30g",
                source_url="https://shop.example.com/product/biscuit-123"
            )
            session.add(sample_product)
            await session.flush()

            session.add(ProductIdentifier(
                product_id=sample_product.id,
                identifier_type="gtin",
                identifier_value=sample_gtin
            ))
            logger.info("Seeded sample test product: Example Biscuit")

        await session.commit()
        logger.info("FoodGuardian database seeding completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed_database())
