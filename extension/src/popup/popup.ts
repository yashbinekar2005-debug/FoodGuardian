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
    if (response && response.analysis) {
      const data: AnalyzeResponse = response.analysis;
      renderAnalysis(data);
    }
  });

  function renderAnalysis(data: AnalyzeResponse) {
    emptyState.style.display = 'none';
    analyzedCard.style.display = 'block';

    const grade = data.rating.grade;
    gradeBadge.textContent = grade;
    gradeBadge.className = `grade-badge grade-${grade}`;
    productTitle.textContent = data.product.name.slice(0, 50) + (data.product.name.length > 50 ? '...' : '');
    productScore.textContent = `FoodGuardian Score: ${Math.round(data.rating.score)} / 100`;

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
