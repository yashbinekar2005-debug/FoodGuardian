import { ExtensionSettings } from '../types';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  enabled: true,
  apiUrl: 'http://localhost:8001/api/v1',
  preferredJurisdiction: 'both',
  displayMode: 'compact',
  autoAnalyze: true
};

function migrateApiUrl(settings: ExtensionSettings): ExtensionSettings {
  // Port 8000 is already used by another local service on some machines.
  // Move the former FoodGuardian default to its dedicated local port.
  if (/^http:\/\/(localhost|127\.0\.0\.1):8000\/api\/v1\/?$/i.test(settings.apiUrl.trim())) {
    return { ...settings, apiUrl: DEFAULT_SETTINGS.apiUrl };
  }
  return settings;
}

export async function getSettings(): Promise<ExtensionSettings> {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['fg_settings'], (result) => {
        if (result && result.fg_settings) {
          const settings = migrateApiUrl({ ...DEFAULT_SETTINGS, ...result.fg_settings });
          if (settings.apiUrl !== result.fg_settings.apiUrl) {
            chrome.storage.local.set({ fg_settings: settings });
          }
          resolve(settings);
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      });
    });
  } else if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem('fg_settings');
    if (raw) {
      try {
        const storedSettings = JSON.parse(raw);
        const settings = migrateApiUrl({ ...DEFAULT_SETTINGS, ...storedSettings });
        if (settings.apiUrl !== storedSettings.apiUrl) {
          localStorage.setItem('fg_settings', JSON.stringify(settings));
        }
        return settings;
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
