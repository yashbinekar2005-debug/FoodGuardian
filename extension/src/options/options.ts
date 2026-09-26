import { getSettings, saveSettings } from '../utils/storage';

document.addEventListener('DOMContentLoaded', async () => {
  const enabledInput = document.getElementById('setting-enabled') as HTMLInputElement;
  const autoAnalyzeInput = document.getElementById('setting-auto-analyze') as HTMLInputElement;
  const jurisdictionSelect = document.getElementById('setting-jurisdiction') as HTMLSelectElement;
  const apiUrlInput = document.getElementById('setting-api-url') as HTMLInputElement;
  const btnSave = document.getElementById('btn-save') as HTMLButtonElement;
  const btnClearCache = document.getElementById('btn-clear-cache') as HTMLButtonElement;
  const statusMsg = document.getElementById('status-msg') as HTMLSpanElement;

  // Load existing settings
  const settings = await getSettings();
  enabledInput.checked = settings.enabled;
  autoAnalyzeInput.checked = settings.autoAnalyze;
  jurisdictionSelect.value = settings.preferredJurisdiction;
  apiUrlInput.value = settings.apiUrl;

  // Save changes
  btnSave.addEventListener('click', async () => {
    await saveSettings({
      enabled: enabledInput.checked,
      autoAnalyze: autoAnalyzeInput.checked,
      preferredJurisdiction: jurisdictionSelect.value as any,
      apiUrl: apiUrlInput.value.trim()
    });

    statusMsg.style.opacity = '1';
    setTimeout(() => {
      statusMsg.style.opacity = '0';
    }, 2500);
  });

  // Clear cache
  btnClearCache.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.remove(['fg_cache'], () => {
        alert('FoodGuardian cached analysis data has been cleared.');
      });
    } else {
      localStorage.removeItem('fg_cache');
      alert('FoodGuardian cached analysis data has been cleared.');
    }
  });
});
