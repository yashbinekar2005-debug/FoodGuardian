import { logger } from '../utils/logger';
import { AnalyzeResponse } from '../types';

// Tab ID -> latest AnalyzeResponse
const tabAnalysisCache = new Map<number, AnalyzeResponse>();

chrome.runtime.onInstalled.addListener(() => {
  logger.info('FoodGuardian Extension installed successfully.');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  if (message.type === 'FG_ANALYSIS_COMPLETE' && tabId !== undefined) {
    tabAnalysisCache.set(tabId, message.payload);
    sendResponse({ status: 'cached' });
  } else if (message.type === 'FG_GET_POPUP_DATA') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0]?.id;
      if (activeTabId && tabAnalysisCache.has(activeTabId)) {
        sendResponse({ analysis: tabAnalysisCache.get(activeTabId) });
      } else {
        // Attempt sending message to content script in active tab
        if (activeTabId) {
          chrome.tabs.sendMessage(activeTabId, { type: 'FG_GET_CURRENT_ANALYSIS' }, (res) => {
            if (chrome.runtime.lastError || !res) {
              sendResponse({ analysis: null });
            } else {
              sendResponse({ analysis: res.analysis });
            }
          });
        } else {
          sendResponse({ analysis: null });
        }
      }
    });
    return true; // Keep channel open for async response
  }
  return true;
});

// Clean up closed tabs from cache
chrome.tabs.onRemoved.addListener((tabId) => {
  tabAnalysisCache.delete(tabId);
});
