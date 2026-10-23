import { AdapterRegistry } from '../adapters/adapter_registry';
import { FoodGuardianApiClient } from '../api/client';
import { PageMutationWatcher } from './mutation_observer';
import '../components/container'; // Essential side-effect: registers customElements.define('foodguardian-root', ...)
import type { FoodGuardianRoot } from '../components/container';
import { getSettings } from '../utils/storage';
import { logger } from '../utils/logger';
import { AnalyzeResponse } from '../types';

let hostRoot: FoodGuardianRoot | null = null;
let lastAnalyzedHash: string = '';
let currentAnalysisResult: AnalyzeResponse | null = null;

function ensureRoot(): FoodGuardianRoot {
  let el = document.querySelector('foodguardian-root') as FoodGuardianRoot;
  if (!el) {
    el = document.createElement('foodguardian-root') as FoodGuardianRoot;
    document.body.appendChild(el);
  }
  return el;
}

const watcher = new PageMutationWatcher(() => {
  analyzeCurrentProduct();
});

async function analyzeCurrentProduct() {
  const settings = await getSettings();
  if (!settings.enabled) {
    logger.info('FoodGuardian is disabled in settings.');
    return;
  }

  const adapter = AdapterRegistry.getAdapterForUrl(window.location.href);
  logger.info(`Analyzing page with adapter: ${adapter.name}`);

  let product = adapter.extractProduct(document);
  // Fallback to GenericAdapter if specific adapter returned null
  if ((!product || !product.name) && adapter.name !== 'Generic E-Commerce Adapter') {
    const genericAdapter = AdapterRegistry.getFallbackAdapter();
    const fallbackProduct = genericAdapter.extractProduct(document);
    if (fallbackProduct && fallbackProduct.name) {
      logger.info('Product detected via Generic Fallback Adapter');
      product = fallbackProduct;
    }
  }

  if (!product || !product.name) {
    watcher.setProductDetected(false);
    logger.info('No product detected on current page.');
    return;
  }

  watcher.setProductDetected(true);

  // Deduplicate analysis if same product and ingredients
  const currentHash = `${product.name}|${product.brand || ''}|${product.ingredients_text || ''}`;
  if (currentHash === lastAnalyzedHash && currentAnalysisResult) {
    return;
  }

  logger.info(`Extracted product: "${product.name}" (${product.brand || 'No brand'})`);
  
  hostRoot = ensureRoot();

  try {
    const analysis = await FoodGuardianApiClient.analyzeProduct(product);
    lastAnalyzedHash = currentHash;
    currentAnalysisResult = analysis;

    if (hostRoot && typeof hostRoot.showData === 'function') {
      hostRoot.showData(analysis);
    }

    // Notify background worker of analyzed product for popup
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'FG_ANALYSIS_COMPLETE',
        payload: analysis
      }).catch(() => {});
    }

  } catch (err: any) {
    logger.error('Analysis failed:', err);
  }
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
      sendResponse({ analysis: currentAnalysisResult });
    } else if (message.type === 'FG_OPEN_DETAILS') {
      if (hostRoot) {
        hostRoot.showDetailsModal();
      }
      sendResponse({ ok: true });
    }
    return true;
  });
}
