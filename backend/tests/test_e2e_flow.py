import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_full_ecommerce_product_analysis_flow(client: AsyncClient):
    """
    Simulates the exact end-to-end flow from Chrome extension content extraction
    through API normalization, regulatory cross-comparison, and rating generation.
    """
    # 1. Product extracted from e-commerce page
    extracted_product_payload = {
        "product": {
            "name": "Britannia Treat Jim Jam Biscuits",
            "brand": "Britannia",
            "url": "https://www.amazon.in/dp/B07N8Z7G9Q",
            "category": "biscuits",
            "ingredients_text": (
                "Refined Wheat Flour (Maida), Sugar (28%), Edible Vegetable Oil (Palm), "
                "Invert Sugar Syrup, Acidity Regulator (INS 330), Emulsifier (INS 322), "
                "Permitted Synthetic Food Colour (INS 110), Iodised Salt"
            ),
            "nutrition": {
                "energy_kcal_100g": 472.0,
                "fat_g_100g": 18.0,
                "saturated_fat_g_100g": 8.5,
                "carbohydrate_g_100g": 72.0,
                "sugars_g_100g": 31.0,
                "protein_g_100g": 5.5,
                "sodium_mg_100g": 280.0
            },
            "identifiers": {
                "asin": "B07N8Z7G9Q",
                "gtin": "8901063012345"
            }
        },
        "jurisdictions": ["IN", "EU"],
        "rule_version": "current"
    }

    # 2. Call analyze API
    response = await client.post("/api/v1/analyze", json=extracted_product_payload)
    assert response.status_code == 200
    data = response.json()

    # 3. Verify analysis identity & rating
    assert data["analysis_id"].startswith("anl_")
    assert data["product"]["brand"] == "Britannia"
    assert data["rating"]["grade"] in ["C", "D", "E", "F"] # High sugar + synthetic dye should appropriately reduce score
    assert 0 <= data["rating"]["score"] <= 100
    assert data["rating"]["confidence"] >= 0.85

    # 4. Verify additive extraction & normalization
    additives_detected = {a["code"]: a for a in data["additives"]}
    assert "E330" in additives_detected # Citric acid
    assert "E322" in additives_detected # Lecithins
    assert "E110" in additives_detected # Sunset yellow FCF

    # 5. Verify India vs EU regulatory comparison
    e110_detail = additives_detected["E110"]
    assert e110_detail["regulatory_status"]["india"] in ["authorized", "limit_applies"]
    assert e110_detail["regulatory_status"]["eu"] in ["authorized", "condition_applies"]
    assert "comparison_summary" in e110_detail
    assert len(e110_detail["comparison_summary"]) > 0

    # 6. Verify nutrition warnings
    assert "Very high sugar" in data["nutrition"]["flags"]
    assert "High saturated fat" in data["nutrition"]["flags"]

    # 7. Verify explainability factors
    factor_names = [f["factor_name"] for f in data["factors"]]
    assert any("Sugar" in fn for fn in factor_names)
    assert any("Additives" in fn for fn in factor_names)

    # 8. Verify official evidence links
    evidence_urls = [e["url"] for e in data["evidence"] if e.get("url")]
    assert any("eur-lex.europa.eu" in url for url in evidence_urls)
    assert any("fssai.gov.in" in url for url in evidence_urls)
