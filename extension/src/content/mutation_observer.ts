import { debounce } from '../utils/debounce';
import { logger } from '../utils/logger';

export class PageMutationWatcher {
  private observer: MutationObserver | null = null;
  private lastUrl: string = '';
  private lastTitle: string = '';
  private onProductChangedCallback: () => void;
  private hasDetectedProduct: boolean = false;
  private pollingTimers: ReturnType<typeof setTimeout>[] = [];
  private routePollTimer: ReturnType<typeof setInterval> | null = null;

  constructor(onProductChanged: () => void) {
    this.onProductChangedCallback = onProductChanged;
    this.lastUrl = window.location.href;
    this.lastTitle = typeof document !== 'undefined' ? document.title : '';
  }

  setProductDetected(detected: boolean) {
    this.hasDetectedProduct = detected;
  }

  start() {
    const debouncedCheck = debounce(() => {
      const currentUrl = window.location.href;
      const currentTitle = document.title;

      const urlChanged = currentUrl !== this.lastUrl;
      const titleChanged = currentTitle !== this.lastTitle && currentTitle.length > 0;

      // Trigger if URL/title changed OR if product hasn't been successfully detected yet.
      if (urlChanged || titleChanged || !this.hasDetectedProduct) {
        if (urlChanged || titleChanged) {
          logger.info('Detected dynamic product or route change. Re-analyzing page...');
          this.lastUrl = currentUrl;
          this.lastTitle = currentTitle;
        }
        this.onProductChangedCallback();
      }
    }, 500);

    // Watch DOM changes
    this.observer = new MutationObserver((mutations) => {
      const relevant = mutations.some(m => {
        const target = m.target as HTMLElement;
        return target && target.tagName !== 'FOODGUARDIAN-ROOT';
      });
      if (relevant) {
        debouncedCheck();
      }
    });

    if (document.body) {
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: false
      });
    }

    // Also listen to SPA history pushState/replaceState & popstate
    window.addEventListener('popstate', () => debouncedCheck());
    window.addEventListener('hashchange', () => debouncedCheck());
    
    try {
      const originalPushState = history.pushState;
      if (originalPushState) {
        history.pushState = function(...args) {
          const result = originalPushState.apply(this, args);
          debouncedCheck();
          return result;
        };
      }
      const originalReplaceState = history.replaceState;
      if (originalReplaceState) {
        history.replaceState = function(...args) {
          const result = originalReplaceState.apply(this, args);
          debouncedCheck();
          return result;
        };
      }
    } catch {
      // Ignore if history is restricted
    }

    // Initial retries cover pages whose product content hydrates after document_idle.
    const checkDelays = [400, 1000, 2200, 4000];
    checkDelays.forEach(delay => {
      const timer = setTimeout(() => {
        if (!this.hasDetectedProduct) {
          this.onProductChangedCallback();
        }
      }, delay);
      this.pollingTimers.push(timer);
    });

    // Some SPAs call pushState from the page's main world. The extension content
    // script runs in an isolated world, so patching history there cannot observe
    // those calls. Poll URL/title to reliably catch route changes without relying
    // on the page to emit a DOM mutation.
    this.routePollTimer = setInterval(() => debouncedCheck(), 600);
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.pollingTimers.forEach(t => clearTimeout(t));
    this.pollingTimers = [];
    if (this.routePollTimer) {
      clearInterval(this.routePollTimer);
      this.routePollTimer = null;
    }
  }
}
