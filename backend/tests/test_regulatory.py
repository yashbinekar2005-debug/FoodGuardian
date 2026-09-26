import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_regulatory_category_specific_rules(client: AsyncClient):
    # Query Sunset Yellow (E110) for biscuits
    res_biscuit = await client.get("/api/v1/regulations?jurisdiction=EU&subject=additive&code=E110&category=biscuits")
    assert res_biscuit.status_code == 200
    data_b = res_biscuit.json()
    assert len(data_b["rules"]) >= 1
    assert data_b["rules"][0]["maximum_level"] == "35"
    assert "adverse effect on activity and attention in children" in data_b["rules"][0]["labelling_requirement"]

    # Query E110 for India (FSSAI)
    res_in = await client.get("/api/v1/regulations?jurisdiction=IN&subject=additive&code=E110&category=biscuits")
    assert res_in.status_code == 200
    data_in = res_in.json()
    assert len(data_in["rules"]) >= 1
    assert data_in["rules"][0]["maximum_level"] == "100"


@pytest.mark.asyncio
async def test_titanium_dioxide_eu_ban_vs_india(client: AsyncClient):
    # E171 in EU is not authorized
    res_eu = await client.get("/api/v1/regulations?jurisdiction=EU&subject=additive&code=E171")
    assert res_eu.status_code == 200
    data_eu = res_eu.json()
    assert len(data_eu["rules"]) >= 1
    assert data_eu["rules"][0]["status"] == "not_authorized"
    assert "2022/63" in data_eu["rules"][0]["regulation_number"]

    # E171 in India
    res_in = await client.get("/api/v1/regulations?jurisdiction=IN&subject=additive&code=E171")
    assert res_in.status_code == 200
    data_in = res_in.json()
    assert len(data_in["rules"]) >= 1
    assert data_in["rules"][0]["status"] == "limit_applies"


@pytest.mark.asyncio
async def test_analyze_with_missing_nutrition_graceful_degradation(client: AsyncClient):
    payload = {
        "product": {
            "name": "Local Spice Mix",
            "ingredients_text": "Coriander, Cumin, Red Chilli, Salt, Monosodium glutamate (INS 621)"
        }
    }
    response = await client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["nutrition"]["available"] is False
    assert data["rating"]["grade"] in ["A", "B", "C", "D", "E", "F"]
    # Confidence should be lower because nutrition is absent
    assert data["rating"]["confidence"] < 0.80
    assert any(f["factor_id"] == "nut_missing" for f in data["factors"])
