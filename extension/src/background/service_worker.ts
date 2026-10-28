import { logger } from '../utils/logger';
import { FoodGuardianApiClient } from '../api/client';
import { AnalyzeResponse, RawProductData } from '../types';
import { DomExtractor } from '../extraction/dom_extractor';

// Tab ID -> latest AnalyzeResponse
const tabAnalysisCache = new Map<number, AnalyzeResponse>();
let offscreenCreation: Promise<void> | null = null;

async function ensureOcrDocument(): Promise<void> {
  const offscreenUrl = chrome.runtime.getURL('offscreen.html');
  const runtimeContexts = chrome.runtime as unknown as {
    getContexts: (filter: { contextTypes: string[]; documentUrls: string[] }) => Promise<unknown[]>;
  };
  const contexts = await runtimeContexts.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl]
  });
  if (contexts.length > 0) return;

  if (!offscreenCreation) {
    const offscreenApi = (chrome as unknown as {
      offscreen: { createDocument: (options: { url: string; reasons: string[]; justification: string }) => Promise<void> };
    }).offscreen;
    offscreenCreation = offscreenApi.createDocument({
      url: 'offscreen.html',
      reasons: ['WORKERS'],
      justification: 'Run local OCR on packaged-food gallery images to read ingredient labels.'
    }).finally(() => {
      offscreenCreation = null;
    });
  }
  await offscreenCreation;
}

async function extractIngredientsFromImages(imageUrls: string[]): Promise<string | null> {
  if (imageUrls.length === 0) return null;
  try {
    await ensureOcrDocument();
    const response = await chrome.runtime.sendMessage({ type: 'FG_RUN_LOCAL_OCR', imageUrls });
    const recognizedText = Array.isArray(response?.texts) ? response.texts.join('\n\n') : '';
    return DomExtractor.extractIngredientsFromText(recognizedText);
  } catch (error) {
    logger.warn('Local package-image OCR was unavailable; continuing with page extraction:', error);
    return null;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  logger.info('FoodGuardian Extension installed successfully.');
});

function getCurrentAnalysis(tabId: number, sendResponse: (response: unknown) => void) {
  chrome.tabs.sendMessage(tabId, { type: 'FG_GET_CURRENT_ANALYSIS' }, (res) => {
    if (!chrome.runtime.lastError && res) {
      waitForProductStatus(tabId, sendResponse, 8, res);
      return;
    }

    // A content script may be missing on an already-open tab (for example,
    // after reloading the extension). Inject it on demand and retry once.
    if (!chrome.scripting?.executeScript) {
      logger.error('The scripting API is unavailable. Check the extension scripting permission.');
      sendResponse({ analysis: null, status: 'unavailable' });
      return;
    }

    void chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] })
      .then(() => {
        waitForProductStatus(tabId, sendResponse, 8);
      })
      .catch((error: unknown) => {
        logger.warn('Could not inject FoodGuardian into the active tab:', error);
        sendResponse({ analysis: null, status: 'unavailable' });
      });
  });
}

function waitForProductStatus(
  tabId: number,
  sendResponse: (response: unknown) => void,
  retriesLeft: number,
  previousResponse?: any
) {
  if (previousResponse?.analysis || previousResponse?.error || previousResponse?.productDetected) {
    sendResponse(formatPopupResponse(previousResponse));
    return;
  }
  if (retriesLeft === 0) {
    sendResponse(previousResponse
      ? formatPopupResponse(previousResponse)
      : { analysis: null, status: 'unavailable' });
    return;
  }

  setTimeout(() => {
    chrome.tabs.sendMessage(tabId, { type: 'FG_GET_CURRENT_ANALYSIS' }, (res) => {
      if (chrome.runtime.lastError || !res) {
        sendResponse({ analysis: null, status: 'unavailable' });
        return;
      }
      waitForProductStatus(tabId, sendResponse, retriesLeft - 1, res);
    });
  }, 250);
}

function formatPopupResponse(res: any) {
  const status = res.analysis
    ? 'complete'
    : res.error
      ? 'analysis-error'
      : res.productDetected
        ? 'analyzing'
        : 'no-product';
  return { analysis: res.analysis, status, error: res.error };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  // Perform backend requests in the extension service worker. Content scripts
  // run in the page's origin and can be blocked by the page's cross-origin
  // policy even when the extension has host permissions.
  if (message.type === 'FG_ANALYZE_PRODUCT') {
    const product = message.product as RawProductData | undefined;
    if (!product?.name) {
      sendResponse({ error: 'No product details were extracted from this page.' });
      return;
    }

    void (async () => {
      if (!product.ingredients_text) {
        const imageUrls = [...new Set([...(product.image_urls || []), product.image_url].filter((url): url is string => Boolean(url)))];
        product.ingredients_text = await extractIngredientsFromImages(imageUrls);
      }
      return FoodGuardianApiClient.analyzeProduct(product, message.jurisdictions);
    })()
      .then((analysis) => {
        // The API's normalized product summary omits source text. Preserve the
        // extracted label text for the on-page Details panel.
        (analysis.product as typeof analysis.product & { ingredients_text?: string | null }).ingredients_text = product.ingredients_text || null;
        if (tabId !== undefined) tabAnalysisCache.set(tabId, analysis);
        sendResponse({ analysis });
      })
      .catch((error: unknown) => {
        const detail = error instanceof Error ? error.message : 'Backend analysis failed.';
        logger.error('Product analysis request failed:', error);
        sendResponse({ error: detail });
      });
    return true;
  }

  if (message.type === 'FG_GET_POPUP_DATA') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0]?.id;
      if (activeTabId && tabAnalysisCache.has(activeTabId)) {
        sendResponse({ analysis: tabAnalysisCache.get(activeTabId), status: 'complete' });
      } else {
        if (activeTabId) {
          getCurrentAnalysis(activeTabId, sendResponse);
        } else {
          sendResponse({ analysis: null, status: 'unavailable' });
        }
      }
    });
    return true; // Keep channel open for async response
  }
  return false;
});

// Clean up closed tabs from cache
chrome.tabs.onRemoved.addListener((tabId) => {
  tabAnalysisCache.delete(tabId);
});
