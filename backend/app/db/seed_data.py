"""FoodGuardian Curated Official Regulatory & Additive Seed Data
Sources:
- FSSAI Food Products Standards & Food Additives Regulations
- FSSAI (Labelling & Display) Regulations
- EU Regulation (EC) No 1333/2008 (Food Additives, Annex II & V)
- EU Regulation (EU) No 1169/2011 (Food Information to Consumers)
- EU Commission Regulation (EU) 2022/63 (Titanium dioxide ban)
- EU Commission Regulation (EU) 2023/915 (Contaminants)
"""
from datetime import datetime
import json

JURISDICTIONS = [
    {
        "id": "IN",
        "name": "India",
        "authority_name": "Food Safety and Standards Authority of India (FSSAI)",
        "country_code": "IN"
    },
    {
        "id": "EU",
        "name": "European Union",
        "authority_name": "European Commission / European Food Safety Authority (EFSA)",
        "country_code": "EU"
    }
]

SOURCES = [
    {
        "id": "00000000-0000-0000-0000-000000000001",
        "jurisdiction_id": "EU",
        "title": "Regulation (EC) No 1333/2008 on food additives",
        "short_title": "EU Reg 1333/2008",
        "url": "https://eur-lex.europa.eu/eli/reg/2008/1333/2026-08-18/eng",
        "document_type": "regulation",
        "effective_version": "2026-08"
    },
    {
        "id": "00000000-0000-0000-0000-000000000002",
        "jurisdiction_id": "EU",
        "title": "Regulation (EU) No 1169/2011 on the provision of food information to consumers",
        "short_title": "EU Reg 1169/2011",
        "url": "https://eur-lex.europa.eu/eli/reg/2011/1169/2025-05-01/eng",
        "document_type": "regulation",
        "effective_version": "2025-05"
    },
    {
        "id": "00000000-0000-0000-0000-000000000003",
        "jurisdiction_id": "EU",
        "title": "Commission Regulation (EU) 2022/63 regarding food additive Titanium dioxide (E 171)",
        "short_title": "EU Reg 2022/63 (E171)",
        "url": "https://eur-lex.europa.eu/eli/reg/2022/63/oj",
        "document_type": "regulation",
        "effective_version": "2022-01"
    },
    {
        "id": "00000000-0000-0000-0000-000000000004",
        "jurisdiction_id": "IN",
        "title": "FSSAI - Food Products Standards & Food Additives Compendium",
        "short_title": "FSSAI Standards Compendium",
        "url": "https://fssai.gov.in/food-law/regulations/compendium/food-products-standards",
        "document_type": "compendium",
        "effective_version": "2026-08"
    },
    {
        "id": "00000000-0000-0000-0000-000000000005",
        "jurisdiction_id": "IN",
        "title": "FSSAI - Food Safety and Standards (Labelling and Display) Regulations",
        "short_title": "FSSAI Labelling & Display",
        "url": "https://www.fssai.gov.in/upload/uploadfiles/files/Compendium_Labelling_Display_17_10_2022.pdf",
        "document_type": "compendium",
        "effective_version": "2022-10"
    }
]

RULE_VERSIONS = [
    {
        "id": "00000000-0000-0000-0000-000000000010",
        "version_code": "2026-08",
        "description": "FoodGuardian Curated Official Regulatory Knowledge Base (FSSAI & EU EUR-Lex consolidated rules)",
        "published_at": datetime(2026, 8, 19, 0, 0),
        "is_active": True
    }
]

SCORING_METHODOLOGIES = [
    {
        "id": "00000000-0000-0000-0000-000000000020",
        "version": "1.0",
        "name": "FoodGuardian Explainable 5-Factor Scoring Methodology",
        "description": "Deterministic scoring evaluating Nutrition (40%), Additives (20%), Regulatory alignment (20%), Ingredient transparency (10%), and Declared allergens (10%).",
        "weights": json.dumps({
            "nutrition": 0.40,
            "additives": 0.20,
            "regulatory": 0.20,
            "transparency": 0.10,
            "allergens": 0.10
        }),
        "thresholds": json.dumps({
            "A": [90, 100],
            "B": [80, 89],
            "C": [70, 79],
            "D": [60, 69],
            "E": [40, 59],
            "F": [0, 39]
        }),
        "is_active": True
    }
]

ADDITIVES = [
    {
        "code": "E330",
        "ins_code": "330",
        "name": "Citric acid",
        "functional_classes": "acidity_regulator,antioxidant,sequestrant",
        "description": "Naturally occurring organic acid widely used as an acidity regulator, preservative, and antioxidant synergist.",
        "source_reference": "Regulation (EC) No 1333/2008 & FSSAI Food Additives Compendium",
        "aliases": ["citric acid", "acid 330", "ins 330", "ins330", "e330", "e-330", "acidity regulator (ins 330)", "acidity regulator (330)"]
    },
    {
        "code": "E110",
        "ins_code": "110",
        "name": "Sunset Yellow FCF",
        "functional_classes": "food_colour",
        "description": "Synthetic petroleum-derived orange-red azo dye used for food and beverage coloration.",
        "source_reference": "Regulation (EC) No 1333/2008 Annex V & FSSAI Synthetic Food Colours",
        "aliases": ["sunset yellow", "sunset yellow fcf", "ins 110", "ins110", "e110", "e-110", "color (ins 110)", "colour (110)", "fd&c yellow no. 6"]
    },
    {
        "code": "E621",
        "ins_code": "621",
        "name": "Monosodium glutamate",
        "functional_classes": "flavour_enhancer",
        "description": "Sodium salt of glutamic acid, an amino acid used extensively as an umami flavor enhancer.",
        "source_reference": "Regulation (EC) No 1333/2008 Annex II & FSSAI Labelling and Standards",
        "aliases": ["monosodium glutamate", "msg", "ins 621", "ins621", "e621", "e-621", "flavour enhancer (ins 621)", "flavor enhancer 621", "glutamate"]
    },
    {
        "code": "E322",
        "ins_code": "322",
        "name": "Lecithins",
        "functional_classes": "emulsifier,antioxidant",
        "description": "Mixture of naturally occurring phospholipids typically derived from soybeans, sunflower, or egg yolk, used to stabilize emulsions.",
        "source_reference": "Regulation (EC) No 1333/2008 Annex II Group I & FSSAI",
        "aliases": ["lecithin", "lecithins", "soya lecithin", "soy lecithin", "ins 322", "ins322", "e322", "e-322", "emulsifier (ins 322)", "emulsifier 322"]
    },
    {
        "code": "E211",
        "ins_code": "211",
        "name": "Sodium benzoate",
        "functional_classes": "preservative",
        "description": "Aromatic carboxylic acid salt used widely as an antimicrobial food preservative in acidic foods.",
        "source_reference": "Regulation (EC) No 1333/2008 Annex II & FSSAI Class II Preservatives",
        "aliases": ["sodium benzoate", "benzoate of soda", "ins 211", "ins211", "e211", "e-211", "preservative (ins 211)", "preservative 211"]
    },
    {
        "code": "E202",
        "ins_code": "202",
        "name": "Potassium sorbate",
        "functional_classes": "preservative",
        "description": "Potassium salt of sorbic acid used as a preservative against molds and yeasts in bakery goods, sauces, and dairy.",
        "source_reference": "Regulation (EC) No 1333/2008 Annex II & FSSAI Class II Preservatives",
        "aliases": ["potassium sorbate", "sorbate", "ins 202", "ins202", "e202", "e-202", "preservative (ins 202)", "preservative 202"]
    },
    {
        "code": "E171",
        "ins_code": "171",
        "name": "Titanium dioxide",
        "functional_classes": "food_colour",
        "description": "Inorganic white pigment. Banned as a food additive in the European Union following EFSA genotoxicity reassessment.",
        "source_reference": "Commission Regulation (EU) 2022/63 & FSSAI Food Additives Compendium",
        "aliases": ["titanium dioxide", "ins 171", "ins171", "e171", "e-171", "colour (ins 171)", "ci 77891"]
    },
    {
        "code": "E951",
        "ins_code": "951",
        "name": "Aspartame",
        "functional_classes": "sweetener",
        "description": "Non-caloric intense artificial sweetener composed of aspartic acid and phenylalanine methyl ester.",
        "source_reference": "Regulation (EC) No 1333/2008 Annex II & FSSAI Artificial Sweeteners",
        "aliases": ["aspartame", "ins 951", "ins951", "e951", "e-951", "artificial sweetener (ins 951)"]
    },
    {
        "code": "E102",
        "ins_code": "102",
        "name": "Tartrazine",
        "functional_classes": "food_colour",
        "description": "Synthetic lemon yellow azo dye used in confectionery, soft drinks, and packaged snacks.",
        "source_reference": "Regulation (EC) No 1333/2008 Annex V & FSSAI Synthetic Food Colours",
        "aliases": ["tartrazine", "ins 102", "ins102", "e102", "e-102", "colour (ins 102)", "fd&c yellow no. 5"]
    },
    {
        "code": "E950",
        "ins_code": "950",
        "name": "Acesulfame potassium",
        "functional_classes": "sweetener",
        "description": "Calorie-free artificial sugar substitute often blended with other sweeteners.",
        "source_reference": "Regulation (EC) No 1333/2008 Annex II & FSSAI Artificial Sweeteners",
        "aliases": ["acesulfame potassium", "acesulfame k", "ace-k", "ins 950", "ins950", "e950", "e-950", "sweetener (ins 950)"]
    },
    {
        "code": "E319",
        "ins_code": "319",
        "name": "Tertiary butylhydroquinone (TBHQ)",
        "functional_classes": "antioxidant",
        "description": "Synthetic aromatic organic compound used to prevent oxidation and rancidity in vegetable oils and animal fats.",
        "source_reference": "Regulation (EC) No 1333/2008 Annex II & FSSAI Antioxidants",
        "aliases": ["tbhq", "tertiary butylhydroquinone", "ins 319", "ins319", "e319", "e-319", "antioxidant (ins 319)"]
    }
]

REGULATORY_RULES = [
    # Citric Acid (E330)
    {
        "jurisdiction_id": "IN",
        "regulation_name": "FSSAI Food Products Standards and Food Additives Regulations",
        "regulation_number": "FSSAI Compendium Part 3",
        "version": "2026-08",
        "substance_id": "E330",
        "food_category": "all",
        "authorization_status": "authorized",
        "maximum_level": "Quantum Satis (GMP)",
        "maximum_level_unit": "GMP",
        "conditions_of_use": "Permitted according to Good Manufacturing Practices (GMP) in standard packaged food categories.",
        "labelling_requirement": "Declared as 'Acidity Regulator (INS 330)' in ingredient list.",
        "source_url": "https://fssai.gov.in/food-law/regulations/compendium/food-products-standards",
        "source_document": "FSSAI Food Additives Compendium Table 1"
    },
    {
        "jurisdiction_id": "EU",
        "regulation_name": "Regulation (EC) No 1333/2008 on food additives",
        "regulation_number": "EC 1333/2008",
        "version": "2026-08",
        "substance_id": "E330",
        "food_category": "all",
        "authorization_status": "authorized",
        "maximum_level": "quantum satis",
        "maximum_level_unit": "quantum satis",
        "conditions_of_use": "Authorized under Annex II Group I additives with general quantum satis permission across processed food categories.",
        "labelling_requirement": "Labelled as 'acidity regulator: citric acid' or 'acidity regulator: E 330'.",
        "source_url": "https://eur-lex.europa.eu/eli/reg/2008/1333/2026-08-18/eng",
        "source_document": "Regulation (EC) No 1333/2008 Annex II Group I"
    },
    # Sunset Yellow FCF (E110)
    {
        "jurisdiction_id": "IN",
        "regulation_name": "FSSAI Food Products Standards and Food Additives Regulations",
        "regulation_number": "FSSAI Compendium Section 3.2.1",
        "version": "2026-08",
        "substance_id": "E110",
        "food_category": "biscuits",
        "authorization_status": "limit_applies",
        "maximum_level": "100",
        "maximum_level_unit": "mg/kg",
        "conditions_of_use": "Permitted synthetic color up to 100 ppm (mg/kg) in biscuits, confectionery, and ready-to-eat savouries.",
        "labelling_requirement": "Mandatory declaration on label: 'CONTAINS PERMITTED SYNTHETIC FOOD COLOUR(S) - (INS 110)'.",
        "source_url": "https://fssai.gov.in/food-law/regulations/compendium/food-products-standards",
        "source_document": "FSSAI Synthetic Food Colours Table 2"
    },
    {
        "jurisdiction_id": "IN",
        "regulation_name": "FSSAI Food Products Standards and Food Additives Regulations",
        "regulation_number": "FSSAI Compendium Section 3.2.1",
        "version": "2026-08",
        "substance_id": "E110",
        "food_category": "all",
        "authorization_status": "limit_applies",
        "maximum_level": "100",
        "maximum_level_unit": "mg/kg",
        "conditions_of_use": "Permitted in specified foods only (cereals, confectionery, beverages) up to 100 mg/kg singly or in combination.",
        "labelling_requirement": "Mandatory declaration of synthetic color with INS code on principal display panel.",
        "source_url": "https://fssai.gov.in/food-law/regulations/compendium/food-products-standards",
        "source_document": "FSSAI Synthetic Food Colours Provisions"
    },
    {
        "jurisdiction_id": "EU",
        "regulation_name": "Regulation (EC) No 1333/2008 on food additives",
        "regulation_number": "EC 1333/2008",
        "version": "2026-08",
        "substance_id": "E110",
        "food_category": "biscuits",
        "authorization_status": "condition_applies",
        "maximum_level": "35",
        "maximum_level_unit": "mg/kg",
        "conditions_of_use": "Permitted in fine bakery wares up to 35 mg/kg. Subject to mandatory Article 24 warning.",
        "labelling_requirement": "MANDATORY WARNING on label: 'Sunset yellow (E 110): may have an adverse effect on activity and attention in children.'",
        "source_url": "https://eur-lex.europa.eu/eli/reg/2008/1333/2026-08-18/eng",
        "source_document": "Regulation (EC) No 1333/2008 Annex II Part E & Annex V"
    },
    {
        "jurisdiction_id": "EU",
        "regulation_name": "Regulation (EC) No 1333/2008 on food additives",
        "regulation_number": "EC 1333/2008",
        "version": "2026-08",
        "substance_id": "E110",
        "food_category": "all",
        "authorization_status": "condition_applies",
        "maximum_level": "50",
        "maximum_level_unit": "mg/kg",
        "conditions_of_use": "Permitted only in specified food categories with strict numeric maximum levels.",
        "labelling_requirement": "MANDATORY WARNING: 'may have an adverse effect on activity and attention in children' (Annex V).",
        "source_url": "https://eur-lex.europa.eu/eli/reg/2008/1333/2026-08-18/eng",
        "source_document": "Regulation (EC) No 1333/2008 Annex V"
    },
    # Monosodium Glutamate (E621)
    {
        "jurisdiction_id": "IN",
        "regulation_name": "FSSAI (Labelling and Display) Regulations & Food Additives Compendium",
        "regulation_number": "FSSAI Labelling Reg. 2020",
        "version": "2026-08",
        "substance_id": "E621",
        "food_category": "all",
        "authorization_status": "condition_applies",
        "maximum_level": "GMP",
        "maximum_level_unit": "GMP",
        "conditions_of_use": "Permitted in specified foods at GMP level. Prohibited in foods meant for infants.",
        "labelling_requirement": "Mandatory declaration: 'Contains added Monosodium Glutamate; Not recommended for infants below 12 months'.",
        "source_url": "https://www.fssai.gov.in/upload/uploadfiles/files/Compendium_Labelling_Display_17_10_2022.pdf",
        "source_document": "FSSAI Labelling Compendium Regulation 2.4.4(6)"
    },
    {
        "jurisdiction_id": "EU",
        "regulation_name": "Regulation (EC) No 1333/2008 on food additives",
        "regulation_number": "EC 1333/2008",
        "version": "2026-08",
        "substance_id": "E621",
        "food_category": "all",
        "authorization_status": "limit_applies",
        "maximum_level": "10000",
        "maximum_level_unit": "mg/kg",
        "conditions_of_use": "Authorized in Annex II Part E in general foods up to 10 g/kg (individually or combination of E620-E625); quantum satis in seasonings.",
        "labelling_requirement": "Labelled as 'flavour enhancer: monosodium glutamate' or 'flavour enhancer: E 621'.",
        "source_url": "https://eur-lex.europa.eu/eli/reg/2008/1333/2026-08-18/eng",
        "source_document": "Regulation (EC) No 1333/2008 Annex II Part C Group IV"
    },
    # Lecithins (E322)
    {
        "jurisdiction_id": "IN",
        "regulation_name": "FSSAI Food Products Standards and Food Additives Regulations",
        "regulation_number": "FSSAI Compendium Part 3",
        "version": "2026-08",
        "substance_id": "E322",
        "food_category": "all",
        "authorization_status": "authorized",
        "maximum_level": "GMP",
        "maximum_level_unit": "GMP",
        "conditions_of_use": "Permitted as emulsifier in bakery, chocolate, and processed foods under GMP.",
        "labelling_requirement": "Declared as 'Emulsifier (INS 322)' in ingredients list. Soya origin requires allergen declaration.",
        "source_url": "https://fssai.gov.in/food-law/regulations/compendium/food-products-standards",
        "source_document": "FSSAI Food Additives Table 3"
    },
    {
        "jurisdiction_id": "EU",
        "regulation_name": "Regulation (EC) No 1333/2008 on food additives",
        "regulation_number": "EC 1333/2008",
        "version": "2026-08",
        "substance_id": "E322",
        "food_category": "all",
        "authorization_status": "authorized",
        "maximum_level": "quantum satis",
        "maximum_level_unit": "quantum satis",
        "conditions_of_use": "Authorized under Group I additives with broad quantum satis permission across categories.",
        "labelling_requirement": "Labelled as 'emulsifier: lecithins' or 'emulsifier: E 322'. Allergen indication required if from soy (EU 1169/2011).",
        "source_url": "https://eur-lex.europa.eu/eli/reg/2008/1333/2026-08-18/eng",
        "source_document": "Regulation (EC) No 1333/2008 Annex II Group I"
    },
    # Sodium Benzoate (E211)
    {
        "jurisdiction_id": "IN",
        "regulation_name": "FSSAI Food Products Standards and Food Additives Regulations",
        "regulation_number": "FSSAI Compendium Part 3.1",
        "version": "2026-08",
        "substance_id": "E211",
        "food_category": "sauce",
        "authorization_status": "limit_applies",
        "maximum_level": "750",
        "maximum_level_unit": "mg/kg",
        "conditions_of_use": "Permitted Class II preservative in tomato sauces, ketchups, and pickles up to 750 ppm (as benzoic acid).",
        "labelling_requirement": "Declared as 'Preservative (INS 211)'.",
        "source_url": "https://fssai.gov.in/food-law/regulations/compendium/food-products-standards",
        "source_document": "FSSAI Class II Preservatives Table 1"
    },
    {
        "jurisdiction_id": "IN",
        "regulation_name": "FSSAI Food Products Standards and Food Additives Regulations",
        "regulation_number": "FSSAI Compendium Part 3.1",
        "version": "2026-08",
        "substance_id": "E211",
        "food_category": "all",
        "authorization_status": "limit_applies",
        "maximum_level": "1000",
        "maximum_level_unit": "mg/kg",
        "conditions_of_use": "Permitted in designated food categories with specific maximum residue limits.",
        "labelling_requirement": "Class II preservative declaration mandatory.",
        "source_url": "https://fssai.gov.in/food-law/regulations/compendium/food-products-standards",
        "source_document": "FSSAI Class II Preservatives Table 1"
    },
    {
        "jurisdiction_id": "EU",
        "regulation_name": "Regulation (EC) No 1333/2008 on food additives",
        "regulation_number": "EC 1333/2008",
        "version": "2026-08",
        "substance_id": "E211",
        "food_category": "sauce",
        "authorization_status": "limit_applies",
        "maximum_level": "1000",
        "maximum_level_unit": "mg/kg",
        "conditions_of_use": "Permitted in Category 12.2 (Sauces) up to 1000 mg/kg expressed as benzoic acid singly or in combination with sorbates.",
        "labelling_requirement": "Labelled as 'preservative: sodium benzoate' or 'preservative: E 211'.",
        "source_url": "https://eur-lex.europa.eu/eli/reg/2008/1333/2026-08-18/eng",
        "source_document": "Regulation (EC) No 1333/2008 Annex II Part E Category 12.2"
    },
    {
        "jurisdiction_id": "EU",
        "regulation_name": "Regulation (EC) No 1333/2008 on food additives",
        "regulation_number": "EC 1333/2008",
        "version": "2026-08",
        "substance_id": "E211",
        "food_category": "all",
        "authorization_status": "limit_applies",
        "maximum_level": "1000",
        "maximum_level_unit": "mg/kg",
        "conditions_of_use": "Authorized in specified categories only; not authorized for general quantum satis use.",
        "labelling_requirement": "Specific preservative function and name required on ingredient list.",
        "source_url": "https://eur-lex.europa.eu/eli/reg/2008/1333/2026-08-18/eng",
        "source_document": "Regulation (EC) No 1333/2008 Annex II"
    },
    # Titanium Dioxide (E171)
    {
        "jurisdiction_id": "IN",
        "regulation_name": "FSSAI Food Products Standards and Food Additives Regulations",
        "regulation_number": "FSSAI Compendium Section 3.2",
        "version": "2026-08",
        "substance_id": "E171",
        "food_category": "all",
        "authorization_status": "limit_applies",
        "maximum_level": "GMP",
        "maximum_level_unit": "GMP",
        "conditions_of_use": "Permitted in designated items like chewing gum, icing, confectionery under GMP.",
        "labelling_requirement": "Declared as 'Colour (INS 171)'.",
        "source_url": "https://fssai.gov.in/food-law/regulations/compendium/food-products-standards",
        "source_document": "FSSAI Food Additives Schedule"
    },
    {
        "jurisdiction_id": "EU",
        "regulation_name": "Commission Regulation (EU) 2022/63 amending Regulation (EC) No 1333/2008",
        "regulation_number": "EU 2022/63",
        "version": "2026-08",
        "substance_id": "E171",
        "food_category": "all",
        "authorization_status": "not_authorized",
        "maximum_level": "0",
        "maximum_level_unit": "mg/kg",
        "conditions_of_use": "Banned as a food additive in the EU following EFSA scientific opinion concluding genotoxicity cannot be ruled out.",
        "labelling_requirement": "Not permitted in food products placed on the EU market after transition phase (August 2022).",
        "source_url": "https://eur-lex.europa.eu/eli/reg/2022/63/oj",
        "source_document": "Commission Regulation (EU) 2022/63 Recitals 8-12"
    },
    # Potassium Sorbate (E202)
    {
        "jurisdiction_id": "IN",
        "regulation_name": "FSSAI Food Products Standards and Food Additives Regulations",
        "regulation_number": "FSSAI Compendium Part 3.1",
        "version": "2026-08",
        "substance_id": "E202",
        "food_category": "all",
        "authorization_status": "limit_applies",
        "maximum_level": "1000",
        "maximum_level_unit": "mg/kg",
        "conditions_of_use": "Permitted Class II preservative in bakery, cheeses, sauces up to 1000 ppm (as sorbic acid).",
        "labelling_requirement": "Declared as 'Preservative (INS 202)'.",
        "source_url": "https://fssai.gov.in/food-law/regulations/compendium/food-products-standards",
        "source_document": "FSSAI Class II Preservatives Table 1"
    },
    {
        "jurisdiction_id": "EU",
        "regulation_name": "Regulation (EC) No 1333/2008 on food additives",
        "regulation_number": "EC 1333/2008",
        "version": "2026-08",
        "substance_id": "E202",
        "food_category": "all",
        "authorization_status": "limit_applies",
        "maximum_level": "1000",
        "maximum_level_unit": "mg/kg",
        "conditions_of_use": "Permitted in multiple food categories with defined maximum levels (typically 1000-2000 mg/kg as sorbic acid).",
        "labelling_requirement": "Labelled as 'preservative: potassium sorbate' or 'preservative: E 202'.",
        "source_url": "https://eur-lex.europa.eu/eli/reg/2008/1333/2026-08-18/eng",
        "source_document": "Regulation (EC) No 1333/2008 Annex II Part E"
    }
]
