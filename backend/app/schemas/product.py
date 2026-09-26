from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class NutritionInput(BaseModel):
    energy_kcal_100g: Optional[float] = Field(None, description="Energy in kcal per 100g")
    fat_g_100g: Optional[float] = Field(None, description="Total fat in grams per 100g")
    saturated_fat_g_100g: Optional[float] = Field(None, description="Saturated fat in grams per 100g")
    carbohydrate_g_100g: Optional[float] = Field(None, description="Carbohydrates in grams per 100g")
    sugars_g_100g: Optional[float] = Field(None, description="Total sugars in grams per 100g")
    protein_g_100g: Optional[float] = Field(None, description="Protein in grams per 100g")
    fiber_g_100g: Optional[float] = Field(None, description="Dietary fiber in grams per 100g")
    sodium_mg_100g: Optional[float] = Field(None, description="Sodium in milligrams per 100g")
    salt_g_100g: Optional[float] = Field(None, description="Salt in grams per 100g")
    serving_size: Optional[str] = Field(None, description="Serving size description e.g. '30g'")


class ProductIdentifiersInput(BaseModel):
    gtin: Optional[str] = Field(None, description="GTIN / EAN / UPC barcode")
    asin: Optional[str] = Field(None, description="Amazon ASIN")
    sku: Optional[str] = Field(None, description="Merchant SKU")


class ProductInput(BaseModel):
    name: str = Field(..., description="Product title/name")
    brand: Optional[str] = Field(None, description="Brand name")
    url: Optional[str] = Field(None, description="Source product page URL")
    category: Optional[str] = Field(None, description="Identified food category e.g. 'biscuits', 'sauce'")
    ingredients_text: Optional[str] = Field(None, description="Raw ingredient string from page")
    nutrition: Optional[NutritionInput] = Field(None, description="Extracted nutrition facts")
    identifiers: Optional[ProductIdentifiersInput] = Field(None, description="Product identifiers")
    package_size: Optional[str] = Field(None, description="Package net weight/size")
    serving_size: Optional[str] = Field(None, description="Serving size if available")


class ProductMatchRequest(BaseModel):
    gtin: Optional[str] = None
    brand: Optional[str] = None
    name: Optional[str] = None
    source_url: Optional[str] = None


class ProductMatchResponse(BaseModel):
    matched: bool
    product_id: Optional[str] = None
    match_method: Optional[str] = None  # gtin, url, fuzzy_name
    confidence: float = 0.0
