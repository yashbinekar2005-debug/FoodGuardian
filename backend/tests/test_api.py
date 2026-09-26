import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "ok"
    assert data["rules_engine"] == "ok"


@pytest.mark.asyncio
async def test_rules_version_endpoint(client: AsyncClient):
    response = await client.get("/api/v1/rules/version")
    assert response.status_code == 200
    data = response.json()
    assert data["regulatory_data_version"] == "2026-08"
    assert data["scoring_methodology_version"] == "1.0"
    assert data["api_version"] == "v1"


@pytest.mark.asyncio
async def test_additive_lookup(client: AsyncClient):
    response = await client.get("/api/v1/additives/E330")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == "E330"
    assert data["name"] == "Citric acid"
    assert "acidity_regulator" in data["functional_classes"]

    # Test not found
    err_res = await client.get("/api/v1/additives/E99999")
    assert err_res.status_code == 404
    err_data = err_res.json()
    assert "error" in err_data
    assert err_data["error"]["code"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_regulations_query(client: AsyncClient):
    response = await client.get("/api/v1/regulations?jurisdiction=EU&subject=additive&code=E330")
    assert response.status_code == 200
    data = response.json()
    assert data["jurisdiction"] == "EU"
    assert len(data["rules"]) > 0
    rule = data["rules"][0]
    assert rule["status"] == "authorized"
    assert "quantum satis" in rule["maximum_level"].lower()


@pytest.mark.asyncio
async def test_product_match(client: AsyncClient):
    response = await client.post("/api/v1/product/match", json={
        "gtin": "8901234567890",
        "brand": "Example Foods",
        "name": "Example Biscuit"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["matched"] is True
    assert data["match_method"] == "gtin"
    assert data["confidence"] == 1.0


@pytest.mark.asyncio
async def test_analyze_endpoint(client: AsyncClient):
    payload = {
        "product": {
            "name": "Example Biscuit",
            "brand": "Example Foods",
            "url": "https://shop.example/product/123",
            "category": "biscuits",
            "ingredients_text": "Wheat flour, sugar, palm oil, salt, INS 322, acidity regulator (INS 330)",
            "nutrition": {
                "energy_kcal_100g": 480,
                "fat_g_100g": 20,
                "sugars_g_100g": 18,
                "sodium_mg_100g": 350
            },
            "identifiers": {
                "gtin": "8901234567890"
            }
        },
        "jurisdictions": ["IN", "EU"],
        "rule_version": "current"
    }

    response = await client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "analysis_id" in data
    assert "rating" in data
    assert data["rating"]["grade"] in ["A", "B", "C", "D", "E", "F"]
    assert 0 <= data["rating"]["score"] <= 100
    assert data["summary"]["recognized_additives"] >= 2
    assert "regulatory_comparison" in data
    assert len(data["regulatory_comparison"]["india"]) >= 1
    assert len(data["regulatory_comparison"]["eu"]) >= 1
    assert len(data["evidence"]) > 0
    assert len(data["factors"]) > 0


@pytest.mark.asyncio
async def test_analyze_validation_error_format(client: AsyncClient):
    # Missing required 'name' field
    payload = {
        "product": {
            "brand": "Incomplete Foods"
        }
    }
    response = await client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 422
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "VALIDATION_ERROR"
    assert "request_id" in data["error"]
