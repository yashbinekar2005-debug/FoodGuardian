import { AdapterRegistry } from '../adapters/adapter_registry';
import { FoodGuardianApiClient } from '../api/client';
import { PageMutationWatcher } from './mutation_observer';
import { getSettings } from '../utils/storage';
import { logger } from '../utils/logger';
import { AnalyzeResponse } from '../types';

let hostRoot: HTMLElement | null = null;
let lastAnalyzedHash: string = '';
let currentAnalysisResult: AnalyzeResponse | null = null;
let currentProductDetected = false;
let currentAnalysisError: string | null = null;
let analysisInProgress = false;
let analysisRequestedWhileBusy = false;

function ensureRoot(): HTMLElement {
  let el = document.querySelector<HTMLElement>('[data-foodguardian-root]');
  if (!el) {
    el = document.createElement('div');
    el.dataset.foodguardianRoot = 'true';
    document.body.appendChild(el);
  }
  return el;
}

function renderAnalysis(analysis: AnalyzeResponse) {
  if (!hostRoot) hostRoot = ensureRoot();
  const shadow = hostRoot.shadowRoot || hostRoot.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      .fg-card { position: fixed; top: 24px; right: 24px; z-index: 2147483647; width: 320px; box-sizing: border-box; overflow: hidden; border: 1px solid #e2e8f0; border-radius: 16px; background: rgba(255,255,255,.97); box-shadow: 0 10px 25px -5px rgba(0,0,0,.18); color: #0f172a; font: 14px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
      .header { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:#f8fafc; border-bottom:1px solid #e2e8f0; font-weight:700; }
      .body { padding:16px; } .row { display:flex; align-items:center; gap:12px; }
      .grade { display:grid; place-items:center; width:44px; height:44px; border-radius:10px; color:#fff; font-size:24px; font-weight:800; background:#d97706; }
      .title { font-weight:700; } .score { color:#64748b; font-size:12px; }
      .actions { display:flex; gap:6px; } button { cursor:pointer; border:0; border-radius:6px; padding:4px 8px; color:#334155; background:#e2e8f0; font:inherit; }
      .details { margin-top:12px; padding-top:10px; border-top:1px solid #e2e8f0; color:#475569; font-size:12px; white-space:pre-wrap; }
      .grade-A { background:#16a34a; } .grade-B { background:#65a30d; } .grade-C { background:#d97706; } .grade-D { background:#ea580c; } .grade-E { background:#dc2626; } .grade-F { background:#991b1b; }
    </style>
    <section class="fg-card" aria-label="FoodGuardian product rating">
      <header class="header"><span>🛡 FoodGuardian</span><div class="actions"><button id="fg-details" type="button">Details</button><button id="fg-close" type="button" aria-label="Dismiss">×</button></div></header>
      <div class="body"><div class="row"><div class="grade" id="fg-grade"></div><div><div class="title" id="fg-title"></div><div class="score" id="fg-score"></div></div></div><div class="details" id="fg-details-content" hidden></div></div>
    </section>`;

  const data = analysis as any;
  const grade = typeof data.rating?.grade === 'string' ? data.rating.grade : 'C';
  const productName = data.product?.name || 'Food product';
  const score = typeof data.rating?.score === 'number' ? Math.round(data.rating.score) : 0;
  const ingredientText = typeof data.product?.ingredients_text === 'string'
    ? data.product.ingredients_text
    : 'Ingredients were not listed on this page.';
  const gradeElement = shadow.getElementById('fg-grade');
  if (gradeElement) {
    gradeElement.textContent = grade;
    gradeElement.classList.add(`grade-${grade}`);
  }
  const titleElement = shadow.getElementById('fg-title');
  if (titleElement) titleElement.textContent = productName;
  const scoreElement = shadow.getElementById('fg-score');
  if (scoreElement) scoreElement.textContent = `FoodGuardian score: ${score}/100`;

  shadow.getElementById('fg-details')?.addEventListener('click', () => {
    const details = shadow.getElementById('fg-details-content');
    if (!details) return;
    details.textContent = `Ingredients:\n${ingredientText}`;
    details.hidden = !details.hidden;
  });
  shadow.getElementById('fg-close')?.addEventListener('click', () => hostRoot?.remove());
}

function showDetails() {
  const shadow = hostRoot?.shadowRoot;
  const detailsButton = shadow?.getElementById('fg-details') as HTMLButtonElement | null;
  detailsButton?.click();
}

const watcher = new PageMutationWatcher(() => {
  analyzeCurrentProduct();
});

async function analyzeCurrentProduct() {
  if (analysisInProgress) {
    analysisRequestedWhileBusy = true;
    return;
  }
  analysisInProgress = true;

  try {
    const settings = await getSettings();
    if (!settings.enabled) {
      logger.info('FoodGuardian is disabled in settings.');
      return;
    }

    const adapter = AdapterRegistry.getAdapterForUrl(window.location.href);
    logger.info(`Analyzing page with adapter: ${adapter.name}`);

    let product: any = null;
    try {
      product = adapter.extractProduct(document);
    } catch (e) {
      logger.error('Adapter extractProduct failed:', e);
      product = null;
    }
    // Fallback to GenericAdapter if specific adapter returned null
    if ((!product || !product.name) && adapter.name !== 'Generic E-Commerce Adapter') {
      try {
        const genericAdapter = AdapterRegistry.getFallbackAdapter();
        const fallbackProduct = genericAdapter.extractProduct(document);
        if (fallbackProduct && fallbackProduct.name) {
          logger.info('Product detected via Generic Fallback Adapter');
          product = fallbackProduct;
        }
      } catch (e) {
        logger.error('Fallback adapter failed:', e);
      }
    }

    if (!product || !product.name) {
      currentProductDetected = false;
      currentAnalysisError = null;
      watcher.setProductDetected(false);
      logger.info('No product detected on current page.');
      return;
    }

    currentProductDetected = true;
    currentAnalysisError = null;
    watcher.setProductDetected(true);

    // Deduplicate analysis if same product and ingredients
    const currentHash = `${product.name}|${product.brand || ''}|${product.ingredients_text || ''}`;
    if (currentHash === lastAnalyzedHash) {
      return;
    }

    logger.info(`Extracted product: "${product.name}" (${product.brand || 'No brand'})`);
    
    try {
      hostRoot = ensureRoot();
    } catch (e) {
      logger.error('Failed to ensure root:', e);
      return;
    }

    try {
      const analysis = typeof chrome !== 'undefined'
        ? await requestBackgroundAnalysis(product)
        : await FoodGuardianApiClient.analyzeProduct(product);
      lastAnalyzedHash = currentHash;
      currentAnalysisResult = analysis;

      renderAnalysis(analysis);

    } catch (err: any) {
      // Avoid hammering the backend if the page keeps mutating while a request
      // is failing. A changed product/ingredient list still gets a fresh try.
      lastAnalyzedHash = currentHash;
      currentAnalysisError = err instanceof Error ? err.message : 'Analysis failed.';
      logger.error('Analysis failed:', err);
    }
  } catch (err: any) {
    logger.error('analyzeCurrentProduct error:', err);
  } finally {
    analysisInProgress = false;
    if (analysisRequestedWhileBusy) {
      analysisRequestedWhileBusy = false;
      void analyzeCurrentProduct();
    }
  }
}

function requestBackgroundAnalysis(product: any): Promise<AnalyzeResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: 'FG_ANALYZE_PRODUCT', product, jurisdictions: ['IN', 'EU'] },
      (response) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message || 'Could not reach the FoodGuardian service worker.'));
          return;
        }
        if (response?.analysis) {
          resolve(response.analysis as AnalyzeResponse);
          return;
        }
        reject(new Error(response?.error || 'FoodGuardian did not receive an analysis result.'));
      }
    );
  });
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    analyzeCurrentProduct();
  });
} else {
  analyzeCurrentProduct();
}

// Watch dynamic SPA route changes / variations
watcher.start();

// Listen for messages from popup or background
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'FG_GET_CURRENT_ANALYSIS') {
      sendResponse({
        analysis: currentAnalysisResult,
        productDetected: currentProductDetected,
        error: currentAnalysisError
      });
    } else if (message.type === 'FG_OPEN_DETAILS') {
      if (hostRoot) {
        showDetails();
      }
      sendResponse({ ok: true });
    }
    return true;
  });
}
