# FoodGuardian Extension - Progress Report & Bug Analysis

**Date:** 2026-10-25  
**Status:** Code fixes built; live browser retest pending

---

## 1. Objective

The goal was to fix the FoodGuardian Chrome extension so that it can:
- Detect packaged food products on live e-commerce websites (Specifically Amazon.in)
- Extract ingredients/nutrition data from the page
- Successfully call the backend at `http://localhost:8001/api/v1/analyze` and display the FoodGuardian rating card and details panel.


---


## 2. What Has Been Achieved

| Area | Status | Notes |
| :-- | :-- | :-- |
| Amazon Adapter | Fixed | `AmazonAdapter.matches()` was made more permissive to catch `/dp/`, ASIN paths and other product routes. Title extraction now has multiple fallbacks. |
| DOM Extraction | Fixed | `DomExtractor.scanDomForIngredients()` now scans Amazon specific selectors (`#detailBullets_feature_div`, `#important-information`, tables, lists) with a full body text fallback. |
| Generic Adapter | Fixed | Now utilizes the improved `DomExtractor` as its primary path. |
| Backend Routes | Fixed | Added root level `/health` endpoint. Added `/v1/models` and `/api/v1/models` to silence the probes coming from clients. The extension's required routes (`/api/v1/analyze` and `/api/v1/health`) are now reachable. |
| Rating Card (`fg-rating-card`) | Fixed | Removed residual `addEventListener` after `innerHTML` inside `render()`. All click interactions use event delegation via `handleClick`. Fully guarded against null/undefined data. |
| Analysis Panel (`fg-analysis-panel`) | Fixed | Guarded all nested property accesses (`add?.regulatory_status?.india`, etc.), guarded all arrays, resolved all TypeScript typing errors, and reinforced defensive fallback rendering. |
| Container (`foodguardian-root`) | Fixed | Dual-bound event listeners to both shadow root and host root with `stopPropagation` to ensure clean Shadow DOM event delegation. |
| Extension Build & Types | Done | `tsc --noEmit` passes with 0 errors. `vite build` completed cleanly, generating fresh `dist/content.js`. |



---


## 3. Actual Bugs Causing The Errors

The errors that you're consistently seeing in `content.js` are not from one singular issue, but from a combination of DOM manipulation and unsafe assumptions.


| Bug | Severity | Location | Root Cause | Impact |
| :-- | :-- | :-- | :-- | :-- |
| Event Listener Re-Attachment | Critical | `rating_card.ts`, `analysis_panel.ts` | `innerHTML = ...` is called on every `render()` (e.g `this.isMinimized = !this.isMinimized; this.render()` and tab switching). The old code was doing `querySelector(...).addEventListener(...)` after replacing the DOM, causing old elements to be lost, listeners to stack on re-renders, or the code to throw when trying to attach to nodes that just got replaced. | Crashes the web components mid-render, breaks the card/panel and can cascade to break the rest of the content script. This matches the minified line you pasted (`#fg-btn-details` being re-queried and having `addEventListener` called after `innerHTML`). |
| Unsafe Property Access | High | `rating_card.ts`, `analysis_panel.ts` | Directly accessing `product.name.slice()`, `rating.score`, `rating.confidence`, `rules.regulatory_version`, etc with no null checks or fallbacks. The backend response isn't guaranteed to have every field. | Throws `TypeError: Cannot read properties of undefined/null` during string interpolation. This was the source of a lot of the panel crashes. |
| Array Assumptions | High | `analysis_panel.ts` | Treating `ingredients`, `additives`, `factors`, `evidence` as arrays without `Array.isArray` checks, and calling `.map()`, `.length`, `.some()` on potentially undefined values. | Crashes tab renders, most notably the "Ingredients", "Additives" and "Regulatory" tabs. |
| Shadow DOM Event Targeting | Medium | `container.ts` | Events bubble through shadow DOM to the host root. The old implementation was coupling rendering and listening in a way that was brittle with re-renders. | Made it very easy for a thrown error in a child component to propagate and prevent other events from firing. |
| Backend Probes | Low (Noise) | `backend/app/main.py` | Clients probing `/v1/models` would 404. | Just log spam in the backend console, doesn't break functionality anymore after adding the routes. |



---


## 4. Current State

- **Extension**: The built bundle (`extension/dist/content.js`) now uses event delegation on both custom elements, has `try/catch` blocks around `render()`, click handlers, and tab switching. All property accesses are guarded with defaults. 
- **Backend**: Root `/health`, `/v1/models`, and `/api/v1/models` are implemented. `/api/v1/health` is still available via the v1 router. `/api/v1/analyze` is unchanged and functional.
- **Compatibility**: The extension should no longer crash the entire content script if the panel fails to render, as failures now fall back to a safe UI message or are caught and logged.



---


## 5. Recommendations To Fully Resolve This

These are the actions to take in order of importance to verify this is actually fixed, as I cannot interact with a live Chrome instance.


| Step | Action | Reason |
| :-- | :-- | :-- |
| 1 | Restart the backend | Ensure the newly added routes (`/health`, `/v1/models`, `/api/v1/models`) are loaded by uvicorn. The logs are still showing the probes, so a reload is needed. |
| 2 | Hard reload the extension | Go to `chrome://extensions/` -> Developer mode -> click the reload button on FoodGuardian. If it was previously loaded, Chrome can cache the old `content.js`. Also ensure it's loaded from `extension/dist/`. |
| 3 | Clear extension context | Close any Amazon tabs that were open during previous broken runs. Open a fresh tab to `https://www.amazon.in/dp/B07B4KQRZG` (or another product). |
| 4 | Debug with DevTools | Open console and network. Look for `[FoodGuardian]` logs. The `GET /v1/models` should now return 200. The card should render. Clicking "Why this rating?" should open the panel with no uncaught exceptions. |
| 5 | Verify the source of the error | If the error still points to the same minified line, check the "Sources" tab in DevTools to see if it's serving `content.js` from a different extension id/path or if there's a cached worker. Use "Disable cache" while DevTools is open. |

---

### Notes
- The fixes that were just applied are the correct architectural fix (event delegation). The main reason that this specific error persists for users is almost always extension cache/reload, not the source code at this point. 
- If after a hard reload and fresh tab you still get an uncaught exception, share the full stack trace (with line numbers from the unminified context, or the expanded error) and the JSON response from `POST /api/v1/analyze` for that page. I can patch against the exact shape from there.

---

## 6. Follow-up Runtime Fix (2026-10-25)

- The live Amazon product test still showed “No Food Product Detected” even though the listing had an Amazon product title and ingredients. The popup previously treated every missing analysis as a detection failure, masking backend request errors.
- Moved product analysis requests from the page content script into the extension service worker so localhost requests use the extension host permission. The content script now sends extracted product data to the worker and displays the returned analysis.
- The popup now distinguishes an inaccessible tab, an analysis in progress, and a backend error from a true no-product result.
- Removed the file URL content-script match and the fixture's manual content-script import, which caused duplicate/invalid fixture execution.
- Prevented repeat requests for the same product when page mutations continue after a failed backend call.
- Verification: `npm run typecheck` passed; `npm test` passed (6 tests); `npm run build` passed. Backend `/api/v1/analyze` accepted the product payload, and its CORS preflight accepted the installed extension origin.
- The popup now retries a missing content-script connection by injecting the packaged `content.js` into the active tab and polling briefly for product detection/analysis to initialize. This covers Chrome tabs that were already open when the extension was reloaded. The injection uses the existing `activeTab` permission.
- The follow-up live screenshot exposed the actual blocker: the imported web-component bundle crashed at `customElements.define` before the content script could register its message listener. The content script no longer imports that bundle; it renders its rating card with standard DOM elements and safe text insertion instead.
- Verification: typecheck passed; the extension test suite passed (6 tests); production build passed. Amazon URL matching and ingredient parsing are covered by the tests.
- **Live end-to-end verification is still pending:** after rebuilding, reload FoodGuardian at `chrome://extensions`, refresh an Amazon packaged-food product page, and confirm the popup shows a grade and the page shows the rating card. The screenshot showed the `customElements.define` crash before this fix.

## 7. API 404 Fix (2026-10-27)

- The latest Amazon screenshot confirms product detection succeeds, but analysis returned `API error (404)`.
- Root cause: `http://localhost:8000` was occupied by another local application (CropSathi AI), so FoodGuardian's `/api/v1/analyze` request reached the wrong server.
- Moved FoodGuardian's local default API to port `8001`, updated the extension settings and docs links, local backend default, Docker host mapping, and README startup/troubleshooting URLs.
- Added automatic migration for the previously saved default `localhost:8000/api/v1` setting to `localhost:8001/api/v1`.
- Verification: `npm run typecheck` passed; `npm test` passed (6 tests); `npm run build` passed. Started FoodGuardian API on port 8001; `GET /api/v1/health` returned `status: ok`, database and rules engine healthy. A `POST /api/v1/analyze` using the screenshot's Amazon ASIN and a representative millet pasta ingredient list returned HTTP 200, grade B, score 82, and 3 analyzed ingredients.
- **Chrome page verification remains for the user:** reload the extension at `chrome://extensions`, refresh the Amazon product tab, and reopen the popup. The app/backend response has been verified, but this environment did not exercise the user's live Chrome tab after extension reload.

## 8. Missing Product Detection After Reload (2026-10-27)

- The new screenshot showed `Cannot read properties of undefined (reading 'executeScript')` in the extension service worker while the popup remained at “No Food Product Detected.”
- Root cause: `chrome.scripting.executeScript` was used to initialize the content script in already-open tabs, but `scripting` was absent from `extension/manifest.json` permissions. The API was therefore undefined and the recovery path crashed.
- Added the `scripting` permission, guarded the injection path with a clear unavailable response, and made the popup display runtime messaging errors and the no-product state explicitly.
- Added the screenshot's Amazon URL (`https://amazon.in/dp/B0CLDFRQKJ`) to the Amazon adapter URL matching test.
- Verification: typecheck passed; all 6 tests passed; production build passed; confirmed `extension/dist/manifest.json` includes `scripting`.
- **User action required for Chrome verification:** at `chrome://extensions`, click **Reload** on FoodGuardian, then refresh the Amazon product tab and reopen the popup. Chrome must reload the extension to grant the newly declared permission. The current live Chrome tab was not operated in this turn.
