import { ExtensionSettings } from '../types';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  apiUrl: 'http://localhost:8000/api/v1',
  preferredJurisdiction: 'both',
  displayMode: 'compact',
  autoAnalyze: true
};

export async function getSettings(): Promise<ExtensionSettings> {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['fg_settings'], (result) => {
        if (result && result.fg_settings) {
          resolve({ ...DEFAULT_SETTINGS, ...result.fg_settings });
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      });
    });
  } else if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('fg_settings');
    if (raw) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
  }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: Partial<ExtensionSettings>): Promise<void> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ fg_settings: updated }, () => resolve());
    });
  } else if (typeof localStorage !== 'undefined') {
    localStorage.setItem('fg_settings', JSON.stringify(updated));
  }
}
