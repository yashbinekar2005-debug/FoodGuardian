import { AnalyzeResponse } from '../types';

export class FgRatingCard extends HTMLElement {
  private analysisData: AnalyzeResponse | null = null;
  private isMinimized = false;

  set data(value: AnalyzeResponse) {
    this.analysisData = value;
    this.render();
  }

  connectedCallback() {
    this.addEventListener('click', this.handleClick);
    this.render();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick);
  }

  private handleClick = (e: Event) => {
    const target = e.target as HTMLElement;
    if (!target) return;

    if (target.id === 'fg-btn-details' || target.closest('#fg-btn-details')) {
      e.preventDefault();
      e.stopPropagation();
      this.dispatchEvent(new CustomEvent('open-details', { bubbles: true, composed: true }));
      return;
    }

    if (target.id === 'fg-btn-minimize' || target.closest('#fg-btn-minimize')) {
      e.preventDefault();
      e.stopPropagation();
      this.isMinimized = !this.isMinimized;
      this.render();
      return;
    }

    if (target.id === 'fg-btn-close' || target.closest('#fg-btn-close')) {
      e.preventDefault();
      e.stopPropagation();
      this.dispatchEvent(new CustomEvent('dismiss-card', { bubbles: true, composed: true }));
      return;
    }
  };

  private getGradeDescription(grade: string): string {
    switch (grade) {
      case 'A': return 'Strong favorable profile';
      case 'B': return 'Generally favorable result';
      case 'C': return 'Mixed factors requiring review';
      case 'D': return 'Multiple attention factors';
      case 'E': return 'Significant factors identified';
      case 'F': return 'Highest concern level';
      case 'NR': return 'Ingredient list needed to rate';
      default: return 'Analyzed';
    }
  }

  private render() {
    try {
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

      const data: any = this.analysisData as any;
      const rating = data.rating || {};
      const summary = data.summary || {};
      const additives = Array.isArray(data.additives) ? data.additives : [];
      const nutrition = data.nutrition || {};
      const ratingAvailable = rating.rating_available !== false;
      const grade = rating.grade || 'NR';
      const gradeClass = `fg-grade-${grade}`;
      const desc = this.getGradeDescription(grade);
      const score = typeof rating.score === 'number' ? Math.round(rating.score) : 0;

      // Pick top 2-3 insights
      const insights: string[] = [];
      if (nutrition.flags && Array.isArray(nutrition.flags) && nutrition.flags.length > 0) {
        insights.push(`⚠️ ${nutrition.flags[0]}`);
      }
      const recognized = typeof summary.recognized_additives === 'number' ? summary.recognized_additives : additives.length;
      if (recognized > 0) {
        insights.push(`ℹ️ ${recognized} additive${recognized > 1 ? 's' : ''} detected`);
      } else {
        insights.push(`ℹ️ No listed additives identified; this alone does not show the product is healthy`);
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
                <div class="fg-grade-pill ${gradeClass}">${grade}</div>
                <div class="fg-rating-meta">
                  <span class="fg-rating-title">FoodGuardian Rating</span>
                  <span class="fg-rating-subtitle">${ratingAvailable ? `${desc} (Score: ${score})` : desc}</span>
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
    } catch (err) {
      console.error('[FoodGuardian][rating-card] render crashed:', err);
      try {
        this.innerHTML = `
          <div class="fg-card-root">
            <div class="fg-card-header">
              <div class="fg-logo-wrap">
                <span class="fg-shield-icon">G</span>
                <span>FoodGuardian</span>
              </div>
            </div>
            <div class="fg-card-body" style="text-align: center; padding: 16px; color: #dc2626;">
              <span>Unable to display rating</span>
            </div>
          </div>
        `;
      } catch {}
    }
  }
}

customElements.define('fg-rating-card', FgRatingCard);
