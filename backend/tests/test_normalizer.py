import pytest
from app.normalization.ingredient_normalizer import normalizer


def test_clean_text():
    raw = "Ingredients: Refined Wheat Flour (Maida), Sugar, Palm Oil."
    cleaned = normalizer.clean_text(raw)
    assert not cleaned.lower().startswith("ingredients:")
    assert "Refined Wheat Flour" in cleaned


def test_split_tokens_nested_parentheses():
    text = "Refined Wheat Flour, Sugar, Palm Oil, Acidity Regulator (INS 330, INS 500(ii)), Salt"
    tokens = normalizer.split_tokens(text)
    assert len(tokens) == 5
    assert tokens[0] == "Refined Wheat Flour"
    assert tokens[3] == "Acidity Regulator (INS 330, INS 500(ii))"
    assert tokens[4] == "Salt"


def test_parse_token_additive_code():
    token = "Acidity Regulator (INS 330)"
    parsed = normalizer.parse_token(token)
    assert parsed["detected_code"] == "E330"
    assert parsed["detected_function"] == "acidity_regulator"

    token_e = "Color (E110)"
    parsed_e = normalizer.parse_token(token_e)
    assert parsed_e["detected_code"] == "E110"
    assert parsed_e["detected_function"] == "color"


def test_parse_token_percentage():
    token = "Whole Wheat Flour (68.5%)"
    parsed = normalizer.parse_token(token)
    assert parsed["percentage"] == "68.5%"
    assert "whole wheat flour" in parsed["clean_name"]
