import { AnalyzeResponse } from '../types';

document.addEventListener('DOMContentLoaded', () => {
  const emptyState = document.getElementById('empty-state')!;
  const analyzedCard = document.getElementById('analyzed-card')!;
  const gradeBadge = document.getElementById('grade-badge')!;
  const productTitle = document.getElementById('product-title')!;
  const productScore = document.getElementById('product-score')!;
  const btnOpenPanel = document.getElementById('btn-open-panel')!;
  const linkOptions = document.getElementById('link-options')!;

  // Open settings
  linkOptions.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });

  // Query background for active tab analysis data
  chrome.runtime.sendMessage({ type: 'FG_GET_POPUP_DATA' }, (response) => {
    const runtimeError = chrome.runtime.lastError;
    if (runtimeError) {
      showEmptyState('FoodGuardian could not read this page', runtimeError.message || 'Refresh the product page and try again.');
      return;
    }

    if (response && response.analysis) {
      const data: AnalyzeResponse = response.analysis;
      renderAnalysis(data);
    } else if (response?.status === 'analysis-error') {
      showEmptyState('Product detected, but analysis failed', response.error || 'Check that the FoodGuardian backend is running.');
    } else if (response?.status === 'analyzing') {
      showEmptyState('Product detected', 'FoodGuardian is still analyzing this product. Reopen the extension in a moment.');
    } else if (response?.status === 'unavailable') {
      showEmptyState('Cannot read this page', 'Refresh the product page and try again.');
    } else if (response?.status === 'no-product') {
      showEmptyState('No food product detected', 'Open a packaged-food product page and wait a moment for analysis.');
    }
  });

  function showEmptyState(title: string, detail: string) {
    const titleElement = emptyState.querySelector('p');
    const detailElement = titleElement?.nextElementSibling;
    if (titleElement) titleElement.textContent = title;
    if (detailElement) detailElement.textContent = detail;
  }

  function renderAnalysis(data: AnalyzeResponse) {
    emptyState.style.display = 'none';
    analyzedCard.style.display = 'block';

    const available = data.rating.rating_available !== false;
    const grade = data.rating.grade;
    gradeBadge.textContent = grade;
    gradeBadge.className = `grade-badge grade-${grade}`;
    productTitle.textContent = data.product.name.slice(0, 50) + (data.product.name.length > 50 ? '...' : '');
    productScore.textContent = available
      ? `FoodGuardian Score: ${Math.round(data.rating.score)} / 100`
      : 'Rating unavailable: ingredient list needed';

    btnOpenPanel.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTabId = tabs[0]?.id;
        if (activeTabId) {
          chrome.tabs.sendMessage(activeTabId, { type: 'FG_OPEN_DETAILS' });
          window.close();
        }
      });
    });
  }
});
