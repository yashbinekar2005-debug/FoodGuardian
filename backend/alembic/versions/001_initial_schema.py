"""Initial FoodGuardian database schema

Revision ID: 001_initial
Revises: 
Create Date: 2026-09-26 19:20:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Jurisdictions
    op.create_table(
        'jurisdictions',
        sa.Column('id', sa.String(length=10), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('authority_name', sa.String(length=255), nullable=False),
        sa.Column('country_code', sa.String(length=10), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. Sources
    op.create_table(
        'sources',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('jurisdiction_id', sa.String(length=10), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('short_title', sa.String(length=100), nullable=False),
        sa.Column('url', sa.Text(), nullable=False),
        sa.Column('document_type', sa.String(length=50), nullable=False),
        sa.Column('effective_version', sa.String(length=50), nullable=True),
        sa.Column('last_checked_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['jurisdiction_id'], ['jurisdictions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_sources_jurisdiction_id', 'sources', ['jurisdiction_id'])

    # 3. Regulatory Rules
    op.create_table(
        'regulatory_rules',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('jurisdiction_id', sa.String(length=10), nullable=False),
        sa.Column('regulation_name', sa.String(length=255), nullable=False),
        sa.Column('regulation_number', sa.String(length=100), nullable=False),
        sa.Column('version', sa.String(length=50), nullable=False),
        sa.Column('effective_from', sa.DateTime(), nullable=True),
        sa.Column('effective_to', sa.DateTime(), nullable=True),
        sa.Column('subject_type', sa.String(length=50), nullable=False),
        sa.Column('substance_id', sa.String(length=100), nullable=False),
        sa.Column('food_category', sa.String(length=100), nullable=False),
        sa.Column('authorization_status', sa.String(length=50), nullable=False),
        sa.Column('maximum_level', sa.String(length=100), nullable=True),
        sa.Column('maximum_level_unit', sa.String(length=50), nullable=True),
        sa.Column('conditions_of_use', sa.Text(), nullable=True),
        sa.Column('labelling_requirement', sa.Text(), nullable=True),
        sa.Column('exceptions', sa.Text(), nullable=True),
        sa.Column('source_id', sa.CHAR(length=36), nullable=True),
        sa.Column('source_url', sa.Text(), nullable=True),
        sa.Column('source_document', sa.Text(), nullable=True),
        sa.Column('source_last_checked', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['jurisdiction_id'], ['jurisdictions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['source_id'], ['sources.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_regulatory_rules_substance_id', 'regulatory_rules', ['substance_id'])
    op.create_index('ix_regulatory_rules_food_category', 'regulatory_rules', ['food_category'])
    op.create_index('ix_reg_rule_lookup', 'regulatory_rules', ['jurisdiction_id', 'substance_id', 'food_category'])

    # 4. Rule Versions
    op.create_table(
        'rule_versions',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('version_code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('published_at', sa.DateTime(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('version_code')
    )

    # 5. Products
    op.create_table(
        'products',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('brand', sa.String(length=255), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('image_url', sa.String(length=1024), nullable=True),
        sa.Column('serving_size', sa.String(length=100), nullable=True),
        sa.Column('package_size', sa.String(length=100), nullable=True),
        sa.Column('source_url', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_products_name', 'products', ['name'])
    op.create_index('ix_products_brand', 'products', ['brand'])
    op.create_index('ix_products_category', 'products', ['category'])

    # 6. Product Identifiers
    op.create_table(
        'product_identifiers',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('product_id', sa.CHAR(length=36), nullable=False),
        sa.Column('identifier_type', sa.String(length=50), nullable=False),
        sa.Column('identifier_value', sa.String(length=100), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('identifier_type', 'identifier_value', name='uq_identifier_type_value')
    )
    op.create_index('ix_product_identifiers_product_id', 'product_identifiers', ['product_id'])
    op.create_index('ix_product_identifiers_identifier_value', 'product_identifiers', ['identifier_value'])

    # 7. Ingredients
    op.create_table(
        'ingredients',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('canonical_name', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_additive', sa.Boolean(), nullable=False),
        sa.Column('additive_code', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('canonical_name')
    )
    op.create_index('ix_ingredients_additive_code', 'ingredients', ['additive_code'])

    # 8. Ingredient Aliases
    op.create_table(
        'ingredient_aliases',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('ingredient_id', sa.CHAR(length=36), nullable=False),
        sa.Column('alias', sa.String(length=255), nullable=False),
        sa.Column('language', sa.String(length=10), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['ingredient_id'], ['ingredients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_ingredient_aliases_ingredient_id', 'ingredient_aliases', ['ingredient_id'])
    op.create_index('ix_ingredient_alias_lower', 'ingredient_aliases', ['alias'])

    # 9. Additives
    op.create_table(
        'additives',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('ins_code', sa.String(length=50), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('functional_classes', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('source_reference', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index('ix_additives_ins_code', 'additives', ['ins_code'])
    op.create_index('ix_additives_name', 'additives', ['name'])

    # 10. Additive Aliases
    op.create_table(
        'additive_aliases',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('additive_id', sa.CHAR(length=36), nullable=False),
        sa.Column('alias', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['additive_id'], ['additives.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_additive_aliases_additive_id', 'additive_aliases', ['additive_id'])
    op.create_index('ix_additive_alias_lower', 'additive_aliases', ['alias'])

    # 11. Ingredient Additive Links
    op.create_table(
        'ingredient_additive_links',
        sa.Column('ingredient_id', sa.CHAR(length=36), nullable=False),
        sa.Column('additive_id', sa.CHAR(length=36), nullable=False),
        sa.ForeignKeyConstraint(['additive_id'], ['additives.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['ingredient_id'], ['ingredients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('ingredient_id', 'additive_id')
    )

    # 12. Nutrition Facts
    op.create_table(
        'nutrition_facts',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('product_id', sa.CHAR(length=36), nullable=True),
        sa.Column('basis', sa.String(length=50), nullable=False),
        sa.Column('energy_kcal', sa.Float(), nullable=True),
        sa.Column('fat_g', sa.Float(), nullable=True),
        sa.Column('saturated_fat_g', sa.Float(), nullable=True),
        sa.Column('carbohydrates_g', sa.Float(), nullable=True),
        sa.Column('sugars_g', sa.Float(), nullable=True),
        sa.Column('fiber_g', sa.Float(), nullable=True),
        sa.Column('protein_g', sa.Float(), nullable=True),
        sa.Column('sodium_mg', sa.Float(), nullable=True),
        sa.Column('salt_g', sa.Float(), nullable=True),
        sa.Column('raw_data', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_nutrition_facts_product_id', 'nutrition_facts', ['product_id'])

    # 13. Scoring Methodologies
    op.create_table(
        'scoring_methodologies',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('version', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('weights', sa.Text(), nullable=False),
        sa.Column('thresholds', sa.Text(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('version')
    )

    # 14. Analysis Results
    op.create_table(
        'analysis_results',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('product_hash', sa.String(length=64), nullable=False),
        sa.Column('product_id', sa.CHAR(length=36), nullable=True),
        sa.Column('grade', sa.String(length=5), nullable=False),
        sa.Column('score', sa.Float(), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('scoring_version', sa.String(length=50), nullable=False),
        sa.Column('regulatory_version', sa.String(length=50), nullable=False),
        sa.Column('result_payload', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_analysis_results_product_hash', 'analysis_results', ['product_hash'])

    # 15. Analysis Factors
    op.create_table(
        'analysis_factors',
        sa.Column('id', sa.CHAR(length=36), nullable=False),
        sa.Column('analysis_id', sa.CHAR(length=36), nullable=False),
        sa.Column('factor_id', sa.String(length=100), nullable=False),
        sa.Column('factor_name', sa.String(length=255), nullable=False),
        sa.Column('impact', sa.String(length=20), nullable=False),
        sa.Column('weight', sa.Float(), nullable=False),
        sa.Column('score_delta', sa.Float(), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('evidence', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['analysis_id'], ['analysis_results.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_analysis_factors_analysis_id', 'analysis_factors', ['analysis_id'])


def downgrade() -> None:
    op.drop_table('analysis_factors')
    op.drop_table('analysis_results')
    op.drop_table('scoring_methodologies')
    op.drop_table('nutrition_facts')
    op.drop_table('ingredient_additive_links')
    op.drop_table('additive_aliases')
    op.drop_table('additives')
    op.drop_table('ingredient_aliases')
    op.drop_table('ingredients')
    op.drop_table('product_identifiers')
    op.drop_table('products')
    op.drop_table('rule_versions')
    op.drop_table('regulatory_rules')
    op.drop_table('sources')
    op.drop_table('jurisdictions')
