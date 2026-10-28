# FoodGuardian 🛡️🥗

> **Food Safety & Ingredient Intelligence Browser Extension & Regulatory Comparison Platform**  
> *Real-time packaged-food ingredient decoding, additive identification, nutrition analysis, and India (FSSAI) vs European Union (EC 1333/2008) regulatory intelligence for online grocery shopping.*

---

## 1. System Overview

**FoodGuardian** is an explainable food-intelligence layer embedded directly into online grocery platforms (Amazon India, BigBasket, Blinkit, Flipkart, and compatible e-commerce stores).

Without requiring physical barcode scanning, FoodGuardian automatically extracts public product information, normalizes ingredients and additive codes (such as INS 330, E110, INS 621), benchmarks nutrition against WHO and FSSAI standards, and performs **category-aware regulatory comparisons between Indian and European Union standards** with complete source traceability.

### Core Capabilities
* **Multi-Level Product Data Extraction**: Site adapters for Amazon, BigBasket, Blinkit, Flipkart, and generic JSON-LD/schema.org fallback with recursive DOM structural inspection.
* **Local Package-Image OCR**: When ingredient text is absent from the page DOM, a bundled Tesseract WebAssembly model reads product-gallery images on-device.
* **Ingredient Normalization**: Tokenizes complex declarations, nested parentheses, percentages, and functional prefixes.
* **Additive Intelligence**: Automatically identifies E-numbers, INS codes, and common chemical names with functional categories.
* **Nutrition Profiling**: Analyzes sugars, saturated fat, sodium/salt, fiber, and protein per 100g.
* **India vs EU Regulatory Comparison**: Factual, category-aware comparison of authorized statuses, maximum permitted levels, and mandatory warnings (e.g. EU child hyperactivity warnings for azo dyes; FSSAI synthetic colour declarations).
* **Proprietary A–F Decision-Support Rating**: Deterministic 5-factor score (0–100) and A–F grade with complete factor breakdown.
* **Shadow DOM Isolation**: Web Components isolated from marketplace CSS and scripts (`<fg-rating-card>`, `<fg-analysis-panel>`).

---

## 2. High-Level Architecture

```text
                  E-COMMERCE WEBPAGE
          (Amazon India, BigBasket, Blinkit, Flipkart)
                          │
                          ▼
            ┌───────────────────────────┐
            │ Chrome Extension (MV3)    │
            │                           │
            │ • Site Adapters           │
            │ • JSON-LD & DOM Extractor │
            │ • Local package-image OCR│
            │ • Active Route/DOM Watcher│
            │ • IIFE Content Bundle     │
            └─────────────┬─────────────┘
                          │ ProductData (JSON)
                          ▼
            ┌───────────────────────────┐
            │   FastAPI Backend API     │
            │      (/api/v1/analyze)    │
            │   • Universal CORS RegEx  │
            │   • OPTIONS Rate Exempt   │
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

## 3. Multi-Level Extraction & Real-Website Resilience

Real e-commerce platforms (Amazon, BigBasket, Blinkit, Flipkart) present dynamic challenges that FoodGuardian resolves across 7 distinct levels:

| Level | Component | Challenge in Real E-Commerce | FoodGuardian Solution |
| :--- | :--- | :--- | :--- |
| **Level 1** | **Bundle Format** | Chrome MV3 content scripts reject external ES module `import` statements with syntax errors. | **Standalone IIFE Packaging**: Bundles the content script into an autonomous, non-chunked IIFE script (`vite.content.config.ts` → `dist/content.js`). |
| **Level 2** | **Component Tree** | Shadow DOM elements (`<foodguardian-root>`, `<fg-rating-card>`) fail to render if definitions are tree-shaken. | **Explicit Custom Element Registration**: Explicit side-effect registration of web components ensures cards and analysis panels mount cleanly. |
| **Level 3** | **SPA Navigation** | Modern grocery apps use React/Next.js client-side navigation. `history.pushState` monkey-patching in isolated worlds does not trigger extension hooks. | **Dual Polling & Worker Sync**: Background service worker listens to `chrome.tabs.onUpdated` and the content watcher polls active URL/DOM mutations every 600ms. |
| **Level 4** | **DOM Parsing** | Real product listings often omit colons after `Ingredients` (e.g. `<th>Ingredients</th><td>...</td>` or `<h4>Ingredients</h4><p>...</p>`). | **Structural DOM Scanner**: `scanDomForIngredients` and `scanDomForNutrition` deeply inspect table headers/cells, definition lists (`<dt>/<dd>`), and adjacent sibling text. |
| **Level 5** | **Backend CORS** | Requests sent from `https://www.amazon.in` send marketplace origin headers that fail standard local CORS checks. | **Universal CORS & Preflight Exemption**: FastAPI `CORSMiddleware` configured with `allow_origin_regex=r".*"` and preflight `OPTIONS` requests exempted from rate limits. |
| **Level 6** | **Lazy-Loaded Specs** | Product text or gallery images can appear after the initial page load. | **Mutation-Aware Re-Scan**: The extension watches the page and gallery image attributes while product details hydrate. |
| **Level 7** | **Ingredients Printed on Packaging** | Product images may show ingredients when the page has no readable text. | **Local OCR Fallback**: Tesseract.js reads up to six product-gallery images locally, then sends recognized ingredient text to the existing analyzer. |

---

## 4. Project Structure

```text
FoodGuardian/
├── extension/                       # Chrome Manifest V3 Browser Extension
│   ├── src/
│   │   ├── adapters/                # Amazon, BigBasket, Blinkit, Flipkart, Generic adapters
│   │   ├── api/                     # Backend API client
│   │   ├── background/              # Background service worker & tab cache
│   │   ├── components/              # Shadow DOM Web Components (card, panel)
│   │   ├── content/                 # Content script & MutationObserver
│   │   ├── extraction/              # JSON-LD & DOM structural extractors
│   │   ├── options/                 # Extension settings UI & logic
│   │   ├── popup/                   # Extension popup UI & manual re-scan logic
│   │   ├── types/                   # TypeScript interfaces
│   │   └── utils/                   # Storage, debounce, logger
│   ├── public/                      # Extension icons and assets
│   ├── tests/                       # Vitest adapter and extraction tests
│   ├── manifest.json                # Chrome Manifest V3 specification
│   ├── package.json                 # Node dependencies and scripts
│   ├── tsconfig.json                # TypeScript compiler configuration
│   ├── vite.config.ts               # Vite multi-entry extension bundler (popup, options, bg)
│   ├── vite.content.config.ts       # Vite IIFE content script bundler
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
├── run_backend.py                   # One-click backend bootstrapper with path resolution
├── docker-compose.yml               # PostgreSQL, Redis, and FastAPI services
├── .env.example                     # Environment template
└── README.md                        # Documentation
```

---

## 5. Getting Started

### Prerequisites
* **Python**: 3.11+ (Python 3.12 and 3.13 supported)
* **Node.js**: 18+ (tested on v20 and v22)
* **npm**: 9+
* **Google Chrome**: Version 110+ (MV3 compliant)

---

### Step 1: Set Up and Start the Backend API

#### 1. Create and Activate Virtual Environment
```bash
# In the FoodGuardian root directory:
python -m venv .venv

# On Windows:
.venv\Scripts\activate

# On macOS/Linux:
source .venv/bin/activate
```

#### 2. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

#### 3. Launch Backend Server
```bash
python run_backend.py
```
*Alternatively, using uvicorn directly:*
```bash
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8001 --reload
```

* On startup, FoodGuardian automatically seeds the verified FSSAI and European Union regulatory database into a local SQLite database (`backend/foodguardian.db`).
* Interactive OpenAPI documentation is accessible at:  
  👉 **http://localhost:8001/docs**
* Health status endpoint:  
  👉 **http://localhost:8001/api/v1/health**

---

### Step 2: Build the Chrome Extension

```bash
cd extension
npm install
npm run build
```
This executes the dual build (`vite build && vite build --config vite.content.config.ts`):
1. Compiles the popup, options page, and background service worker.
2. Compiles `content.js` as a self-contained IIFE bundle into `extension/dist/content.js`.

---

### Step 3: Load Extension into Google Chrome

1. Open Google Chrome and enter `chrome://extensions` in the address bar.
2. Toggle on **Developer mode** in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Browse to and select the `extension/dist` folder inside your FoodGuardian project.
5. The **FoodGuardian** extension card will appear with its icon and version `1.0.0`.

---

### Step 4: Test on E-Commerce Pages

#### Method A: Built-In Realistic Test Fixture
A pre-configured, realistic Amazon India product page is included:
1. In Google Chrome, press `Ctrl + O` (or navigate to `file:///.../FoodGuardian/extension/test_fixture.html`).
2. FoodGuardian automatically detects the product (`Britannia Good Day Butter Cookies`), extracts ingredients, calls the local backend, and injects the rating card into the buy box.
3. Click **"Why this rating?"** to open the Shadow DOM slide-in drawer showing the 5-factor breakdown and India vs EU regulatory comparison table.

#### Method B: Live E-Commerce Websites
1. Open a packaged-food item on Amazon India or [Flipkart](https://www.flipkart.com) (e.g. *"Maggi Noodles"*).
2. FoodGuardian extracts ingredient text from product details first, then checks packaging-gallery images locally when the page has no ingredient text.
3. If a product loads specifications dynamically after clicking "See More", click the **FoodGuardian extension icon** in your toolbar and press **"⚡ Re-scan Current Page"**.

---

## 6. API Specification Summary

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

## 7. Testing Suite

### Run Backend Tests (Pytest)
```bash
.venv\Scripts\python -m pytest backend/tests
```
* **17 passing tests** covering:
  * Ingredient tokenization and alias resolution
  * Additive E-number / INS regex extraction
  * Category-specific regulatory divergence
  * Titanium Dioxide (E171) EU ban vs India allowance
  * High-sugar / high-sodium WHO penalty scoring
  * Graceful degradation when nutrition labels are absent
  * Full E2E analysis flows

### Run Extension Tests (Vitest)
```bash
cd extension
npm test
```
* **6 passing tests** covering:
  * Amazon, BigBasket, and Blinkit URL recognition
  * Generic fallback adapter execution
  * DOM nutrition string parsing

---

## 8. Regulatory Intelligence & Trust Model

FoodGuardian adheres strictly to objective, evidence-backed regulatory comparison:
* **Factual Status Only**: Distinguishes `authorized`, `limit_applies`, `condition_applies`, `not_authorized`, and `unknown`.
* **Category Awareness**: Distinguishes rules for biscuits, sauces, confectionery, and beverages from general permissions.
* **No Simplistic Labels**: Never converts regulatory divergence into sensational claims.
* **Direct Attribution**: Links directly to official EUR-Lex and FSSAI source documents.

---

## 9. Troubleshooting & FAQ

**Q: The badge does not show up on a product page.**  
* **Check Backend**: Verify the backend is running (`curl http://localhost:8001/api/v1/health`).
* **Check Extension Dist**: Ensure you loaded `extension/dist` (and ran `npm run build` inside `extension/`).
* **Manual Re-scan**: Click the FoodGuardian extension popup and click `⚡ Re-scan Current Page`.

**Q: Ingredients are hidden behind a "See More" button.**  
* Scroll down to the Product Information or Ingredients section and expand it, then click `⚡ Re-scan Current Page` in the popup.

---

## 10. License

FoodGuardian is built for transparency and consumer education under the MIT License.
