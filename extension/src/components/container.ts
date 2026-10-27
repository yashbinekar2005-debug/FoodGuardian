import { COMPONENT_STYLES } from './styles';
import { AnalyzeResponse } from '../types';
import './rating_card';
import './analysis_panel';
import { FgRatingCard } from './rating_card';
import { FgAnalysisPanel } from './analysis_panel';

export class FoodGuardianRoot extends HTMLElement {
  private shadow: ShadowRoot;
  private ratingCard: FgRatingCard | null = null;
  private analysisPanel: FgAnalysisPanel | null = null;
  private currentData: AnalyzeResponse | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = COMPONENT_STYLES;
    this.shadow.appendChild(styleSheet);

    const handleOpen = (e: Event) => {
      e.stopPropagation();
      this.showDetailsModal();
    };
    const handleClose = (e: Event) => {
      e.stopPropagation();
      this.hideDetailsModal();
    };
    const handleDismiss = (e: Event) => {
      e.stopPropagation();
      if (this.ratingCard) {
        this.ratingCard.style.display = 'none';
      }
    };

    this.shadow.addEventListener('open-details', handleOpen);
    this.shadow.addEventListener('close-details', handleClose);
    this.shadow.addEventListener('dismiss-card', handleDismiss);

    this.addEventListener('open-details', handleOpen);
    this.addEventListener('close-details', handleClose);
    this.addEventListener('dismiss-card', handleDismiss);
  }

  showData(data: AnalyzeResponse) {
    try {
      this.currentData = data;

      if (!this.ratingCard) {
        this.ratingCard = document.createElement('fg-rating-card') as FgRatingCard;
        this.shadow.appendChild(this.ratingCard);
      }
      this.ratingCard.style.display = 'block';
      (this.ratingCard as any).data = data;
    } catch (err) {
      console.error('[FoodGuardian][container] showData error:', err);
    }
  }

  showDetailsModal() {
    try {
      if (!this.currentData) return;
      if (!this.analysisPanel) {
        this.analysisPanel = document.createElement('fg-analysis-panel') as FgAnalysisPanel;
        this.shadow.appendChild(this.analysisPanel);
      }
      (this.analysisPanel as any).data = this.currentData;
    } catch (err) {
      console.error('[FoodGuardian][container] showDetailsModal error:', err);
    }
  }

  hideDetailsModal() {
    if (this.analysisPanel && this.analysisPanel.parentNode) {
      this.analysisPanel.parentNode.removeChild(this.analysisPanel);
      this.analysisPanel = null;
    }
  }
}

customElements.define('foodguardian-root', FoodGuardianRoot);
