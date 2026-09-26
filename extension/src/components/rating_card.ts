import { AnalyzeResponse } from '../types';

export class FgRatingCard extends HTMLElement {
  private analysisData: AnalyzeResponse | null = null;
  private isMinimized = false;

  set data(value: AnalyzeResponse) {
    this.analysisData = value;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  private getGradeDescription(grade: string): string {
    switch (grade) {
      case 'A': return 'Strong favorable profile';
      case 'B': return 'Generally favorable result';
      case 'C': return 'Mixed factors requiring review';
      case 'D': return 'Multiple attention factors';
      case 'E': return 'Significant factors identified';
      case 'F': return 'Highest concern level';
      default: return 'Analyzed';
    }
  }

  private render() {
    if (!this.analysisData) {
      this.innerHTML = `
        <div class="fg-card-root">
          <div class="fg-card-header">
            <div class="fg-logo-wrap">
              <span class="fg-shield-icon">G</span>
              <span>FoodGuardian</span>
            </div>
          </div>
          <div class="fg-card-body" style="text-align: center; padding: 20px; color: #64748b;">
            <span>Analyzing food product information...</span>
          </div>
        </div>
      `;
      return;
    }

    const { rating, summary, additives, nutrition } = this.analysisData;
    const gradeClass = `fg-grade-${rating.grade}`;
    const desc = this.getGradeDescription(rating.grade);

    // Pick top 2-3 insights
    const insights: string[] = [];
    if (nutrition.flags && nutrition.flags.length > 0) {
      insights.push(`⚠️ ${nutrition.flags[0]}`);
    }
    if (summary.recognized_additives > 0) {
      insights.push(`ℹ️ ${summary.recognized_additives} additive${summary.recognized_additives > 1 ? 's' : ''} detected`);
    } else {
      insights.push(`✓ No artificial additives detected`);
    }
    if (nutrition.available) {
      insights.push(`✓ Nutrition facts verified`);
    }

    this.innerHTML = `
      <div class="fg-card-root" style="${this.isMinimized ? 'width: auto; padding: 6px 12px;' : ''}">
        <div class="fg-card-header" style="${this.isMinimized ? 'border: none; padding: 0;' : ''}">
          <div class="fg-logo-wrap">
            <span class="fg-shield-icon">G</span>
            <span>FoodGuardian</span>
          </div>
          <div class="fg-card-actions">
            <button class="fg-icon-btn" id="fg-btn-minimize" title="${this.isMinimized ? 'Expand' : 'Minimize'}">
              ${this.isMinimized ? '□' : '–'}
            </button>
            <button class="fg-icon-btn" id="fg-btn-close" title="Dismiss">×</button>
          </div>
        </div>

        ${!this.isMinimized ? `
          <div class="fg-card-body">
            <div class="fg-rating-row">
              <div class="fg-grade-pill ${gradeClass}">${rating.grade}</div>
              <div class="fg-rating-meta">
                <span class="fg-rating-title">FoodGuardian Rating</span>
                <span class="fg-rating-subtitle">${desc} (Score: ${Math.round(rating.score)})</span>
              </div>
            </div>

            <div class="fg-insights-list">
              ${insights.map(i => `<div class="fg-insight-item"><span>${i}</span></div>`).join('')}
            </div>

            <button class="fg-cta-btn" id="fg-btn-details">
              <span>Why this rating?</span>
              <span>→</span>
            </button>
          </div>
        ` : ''}
      </div>
    `;

    // Event listeners
    this.querySelector('#fg-btn-details')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('open-details', { bubbles: true, composed: true }));
    });

    this.querySelector('#fg-btn-minimize')?.addEventListener('click', () => {
      this.isMinimized = !this.isMinimized;
      this.render();
    });

    this.querySelector('#fg-btn-close')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('dismiss-card', { bubbles: true, composed: true }));
    });
  }
}

customElements.define('fg-rating-card', FgRatingCard);
