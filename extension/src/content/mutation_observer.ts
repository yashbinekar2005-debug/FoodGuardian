import { debounce } from '../utils/debounce';
import { logger } from '../utils/logger';

export class PageMutationWatcher {
  private observer: MutationObserver | null = null;
  private lastUrl: string = '';
  private lastTitle: string = '';
  private onProductChangedCallback: () => void;

  constructor(onProductChanged: () => void) {
    this.onProductChangedCallback = onProductChanged;
    this.lastUrl = window.location.href;
    this.lastTitle = document.title;
  }

  start() {
    const debouncedCheck = debounce(() => {
      const currentUrl = window.location.href;
      const currentTitle = document.title;

      const urlChanged = currentUrl !== this.lastUrl;
      const titleChanged = currentTitle !== this.lastTitle && currentTitle.length > 0;

      if (urlChanged || titleChanged) {
        logger.info('Detected dynamic product change. Re-analyzing page...');
        this.lastUrl = currentUrl;
        this.lastTitle = currentTitle;
        this.onProductChangedCallback();
      }
    }, 600);

    this.observer = new MutationObserver((mutations) => {
      // Ignore mutations originating from FoodGuardian UI itself
      const relevant = mutations.some(m => {
        const target = m.target as HTMLElement;
        return target && target.tagName !== 'FOODGUARDIAN-ROOT';
      });
      if (relevant) {
        debouncedCheck();
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: false
    });
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
