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

    this.shadow.addEventListener('open-details', () => {
      this.showDetailsModal();
    });

    this.shadow.addEventListener('close-details', () => {
      this.hideDetailsModal();
    });

    this.shadow.addEventListener('dismiss-card', () => {
      if (this.ratingCard) {
        this.ratingCard.style.display = 'none';
      }
    });
  }

  showData(data: AnalyzeResponse) {
    this.currentData = data;

    if (!this.ratingCard) {
      this.ratingCard = document.createElement('fg-rating-card') as FgRatingCard;
      this.shadow.appendChild(this.ratingCard);
    }
    this.ratingCard.style.display = 'block';
    this.ratingCard.data = data;
  }

  showDetailsModal() {
    if (!this.currentData) return;
    if (!this.analysisPanel) {
      this.analysisPanel = document.createElement('fg-analysis-panel') as FgAnalysisPanel;
      this.shadow.appendChild(this.analysisPanel);
    }
    this.analysisPanel.data = this.currentData;
  }

  hideDetailsModal() {
    if (this.analysisPanel && this.analysisPanel.parentNode) {
      this.analysisPanel.parentNode.removeChild(this.analysisPanel);
      this.analysisPanel = null;
    }
  }
}

customElements.define('foodguardian-root', FoodGuardianRoot);
