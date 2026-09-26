import { AdapterRegistry } from '../adapters/adapter_registry';
import { FoodGuardianApiClient } from '../api/client';
import { PageMutationWatcher } from './mutation_observer';
import { FoodGuardianRoot } from '../components/container';
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

async function analyzeCurrentProduct() {
  const settings = await getSettings();
  if (!settings.enabled) {
    logger.info('FoodGuardian is disabled in settings.');
    return;
  }

  const adapter = AdapterRegistry.getAdapterForUrl(window.location.href);
  logger.info(`Analyzing page with adapter: ${adapter.name}`);

  const product = adapter.extractProduct(document);
  if (!product || !product.name) {
    logger.info('No product detected on current page.');
    return;
  }

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

    hostRoot.showData(analysis);

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
const watcher = new PageMutationWatcher(() => {
  analyzeCurrentProduct();
});
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
