# FoodGuardian 🛡️🥗

> **Food Safety & Ingredient Intelligence Browser Extension & Regulatory Comparison Platform**  
> *Real-time packaged-food ingredient decoding, additive identification, nutrition analysis, and India (FSSAI) vs European Union (EC 1333/2008) regulatory intelligence for online grocery shopping.*

---

## 1. System Overview

**FoodGuardian** is an explainable food-intelligence layer embedded directly into online grocery platforms (Amazon India, BigBasket, Blinkit, and compatible e-commerce stores).

Without requiring physical barcode scanning, FoodGuardian automatically extracts public product information, normalizes ingredients and additive codes (such as INS 330, E110, INS 621), benchmarks nutrition against WHO and FSSAI standards, and performs **category-aware regulatory comparisons between Indian and European Union standards** with complete source traceability.

### Core Capabilities
* **Product Data Extraction**: Site adapters for Amazon, BigBasket, Blinkit, and generic JSON-LD/schema.org fallback.
* **Ingredient Normalization**: Tokenizes complex declarations, nested parentheses, percentages, and functional prefixes.
* **Additive Intelligence**: Automatically identifies E-numbers, INS codes, and common chemical names with functional categories.
* **Nutrition Profiling**: Analyzes sugars, saturated fat, sodium/salt, fiber, and protein per 100g.
* **India vs EU Regulatory Comparison**: Factual, category-aware comparison of authorized statuses, maximum permitted levels, and mandatory warnings (e.g. EU child hyperactivity warnings for azo dyes; FSSAI synthetic colour declarations).
* **Proprietary A–F Decision-Support Rating**: Deterministic 5-factor score (0–100) and A–F grade with complete factor breakdown.
* **Shadow DOM Isolation**: Web Components isolated from marketplace CSS and scripts.

---

## 2. High-Level Architecture

```text
                  E-COMMERCE WEBPAGE
          (Amazon India, BigBasket, Blinkit)
                          │
                          ▼
            ┌───────────────────────────┐
            │ Chrome Extension (MV3)    │
            │                           │
            │ • Site Adapters           │
            │ • JSON-LD & DOM Extractor │
            │ • MutationObserver Watcher│
            └─────────────┬─────────────┘
                          │ ProductData (JSON)
                          ▼
            ┌───────────────────────────┐
            │   FastAPI Backend API     │
            │      (/api/v1/analyze)    │
            └─────────────┬─────────────┘
                          │
      ┌───────────────────┼───────────────────┐
      ▼                   ▼                   ▼
  Ingredient         Regulatory           Nutrition
  Normalizer        Rule Engine            Analyzer
      │                   │                   │
      └───────────────────┼───────────────────┘
                          ▼
            ┌───────────────────────────┐
            │  Scoring Engine (0-100)   │
            │  5 Factors → Grade A to F │
            └─────────────┬─────────────┘
                          │
                          ▼
            ┌───────────────────────────┐
            │  Official Evidence Layer  │
            │  • FSSAI Compendiums      │
            │  • EU Reg (EC) 1333/2008  │
            │  • EU Reg (EU) 1169/2011  │
            └─────────────┬─────────────┘
                          │
                          ▼
            ┌───────────────────────────┐
            │  PostgreSQL / SQLite      │
            │  Redis Cache Engine       │
            └───────────────────────────┘
                          │
                          ▼
            ┌───────────────────────────┐
            │  Isolated Shadow DOM UI   │
            │  • <fg-rating-card>       │
            │  • <fg-analysis-panel>    │
            └───────────────────────────┘
```

---

## 3. Project Structure

```text
FoodGuardian/
├── extension/                       # Chrome Manifest V3 Browser Extension
│   ├── src/
│   │   ├── adapters/                # Amazon, BigBasket, Blinkit, Generic adapters
│   │   ├── api/                     # Backend API client
│   │   ├── background/              # Background service worker & tab cache
│   │   ├── components/              # Shadow DOM Web Components (card, panel)
│   │   ├── content/                 # Content script & MutationObserver
│   │   ├── extraction/              # JSON-LD & DOM nutrition/ingredient extractors
│   │   ├── options/                 # Extension settings UI & logic
│   │   ├── popup/                   # Extension popup UI & logic
│   │   ├── types/                   # TypeScript interfaces
│   │   └── utils/                   # Storage, debounce, logger
│   ├── public/                      # Extension icons and assets
│   ├── tests/                       # Vitest adapter and extraction tests
│   ├── manifest.json                # Chrome Manifest V3 specification
│   ├── package.json                 # Node dependencies and scripts
│   ├── tsconfig.json                # TypeScript compiler configuration
│   ├── vite.config.ts               # Vite multi-entry extension bundler
│   └── test_fixture.html            # Realistic test fixture simulating Amazon.in
│
├── backend/                         # FastAPI Intelligence Backend
│   ├── app/
│   │   ├── api/v1/                  # REST API route handlers
│   │   │   ├── analyze.py           # POST /api/v1/analyze
│   │   │   ├── products.py          # POST /api/v1/product/match
│   │   │   ├── ingredients.py       # GET /api/v1/ingredients/{id}
│   │   │   ├── additives.py         # GET /api/v1/additives/{code}
│   │   │   ├── regulations.py       # GET /api/v1/regulations
│   │   │   ├── rules.py             # GET /api/v1/rules/version
│   │   │   └── health.py            # GET /api/v1/health
│   │   ├── core/                    # Config, database, security, middleware
│   │   ├── db/                      # Seed data and initialization
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   ├── normalization/           # Ingredient tokenizer & normalizer
│   │   ├── regulatory/              # Category-aware regulatory comparison engine
│   │   ├── schemas/                 # Pydantic v2 schemas
│   │   ├── scoring/                 # Deterministic 5-factor scoring engine
│   │   └── services/                # Business logic services
│   ├── tests/                       # Pytest unit, integration, and E2E tests
│   ├── alembic/                     # Database migrations
│   ├── requirements.txt             # Python dependencies
│   ├── Dockerfile                   # Production container definition
│   └── pytest.ini                   # Pytest configuration
│
├── docker-compose.yml               # PostgreSQL, Redis, and FastAPI services
├── .env.example                     # Environment template
└── README.md                        # Documentation
```

---

## 4. Getting Started

### Prerequisites
* **Python**: 3.11+
* **Node.js**: 18+ (tested on v22)
* **npm**: 9+
* **Docker** *(Optional, for containerized PostgreSQL & Redis)*

---

### Step 1: Start the Backend API

#### Option A: Instant Local Development (SQLite)
Zero external dependencies required; runs immediately on your local machine.

From the root project directory:
```bash
python run_backend.py
```
*Or using uvicorn directly from root:*
```bash
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```
*Or from inside the backend directory:*
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
On startup, FoodGuardian automatically seeds the verified FSSAI and European Union regulatory dataset into the database.

Interactive OpenAPI documentation is immediately available at:
👉 **http://localhost:8000/docs**

#### Option B: Docker Compose (PostgreSQL + Redis + FastAPI)
```bash
docker-compose up -d
```

---

### Step 2: Build the Chrome Extension

```bash
cd extension
npm install
npm run build
```
The compiled, ready-to-load Manifest V3 extension will be created in `extension/dist/`.

---

### Step 3: Load Extension into Google Chrome

1. Open Google Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** using the toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the `extension/dist` directory (`c:\...\FoodGuardian\extension\dist`).
5. The **FoodGuardian** extension is now active!

---

### Step 4: Test on E-Commerce Pages

1. Open any food product on Amazon India (e.g. biscuits, snacks, sauces).
2. Or open the built-in local test fixture:
   ```bash
   # Open extension/test_fixture.html in Chrome
   ```
3. FoodGuardian detects the product, analyzes the ingredients, and injects the **FoodGuardian Rating Card** (`<fg-rating-card>`) into the page.
4. Click **[Why this rating?]** to open the full **Detailed Analysis Panel** with India vs EU regulatory comparison tables and official evidence links.

---

## 5. API Specification Summary

All endpoints are versioned under `/api/v1`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/analyze` | Analyzes product ingredients, nutrition, additives, and evaluates India vs EU regulations. Returns A–F rating, factors, and sources. |
| `POST` | `/api/v1/product/match` | Matches product by barcode GTIN, URL, or Brand + Name. |
| `GET` | `/api/v1/ingredients/{id}` | Retrieves canonical ingredient details and known aliases. |
| `GET` | `/api/v1/additives/{code}` | Retrieves additive metadata (e.g., E330, INS 110) with functional classes. |
| `GET` | `/api/v1/regulations` | Queries regulatory rules filtered by jurisdiction (`IN` / `EU`), category, and additive code. |
| `GET` | `/api/v1/rules/version` | Returns active regulatory snapshot version (`2026-08`) and scoring version (`1.0`). |
| `GET` | `/api/v1/health` | Health check verifying database and rule engine state. |

---

## 6. Testing

### Run Backend Tests (Pytest)
```bash
cd backend
pytest
```
*17 tests covering ingredient normalization, additive matching, category-aware regulatory rules, titanium dioxide EU ban, high-sugar penalties, standardized error envelopes, and complete E2E flows.*

### Run Extension Tests (Vitest)
```bash
cd extension
npm test
```
*Tests covering URL matching for Amazon, BigBasket, Blinkit, adapter fallback, and DOM nutrition parsing.*

---

## 7. Regulatory Intelligence & Trust Model

FoodGuardian adheres strictly to objective, evidence-backed regulatory comparison:
* **Factual Status Only**: Distinguishes `authorized`, `limit_applies`, `condition_applies`, `not_authorized`, and `unknown`.
* **Category Awareness**: Distinguishes rules for biscuits, sauces, confectionery, and beverages from general permissions.
* **No Simplistic Labels**: Never converts regulatory divergence into sensational claims.
* **Direct Attribution**: Links directly to official EUR-Lex and FSSAI source documents.

---

## 8. License

FoodGuardian is built for transparency and consumer education under the MIT License.
