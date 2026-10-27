import { AnalyzeResponse } from '../types';

export class FgAnalysisPanel extends HTMLElement {
  private analysisData: AnalyzeResponse | null = null;
  private activeTab: 'overview' | 'factors' | 'nutrition' | 'ingredients' | 'additives' | 'regulatory' | 'sources' = 'overview';

  set data(value: AnalyzeResponse) {
    this.analysisData = value;
    this.render();
  }

  connectedCallback() {
    this.addEventListener('click', this.handleClick);
    window.addEventListener('keydown', this.handleKeyDown);
    this.render();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick);
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      this.close();
    }
  };

  private handleClick = (e: Event) => {
    try {
      const target = e.target as HTMLElement;
      if (!target) return;

      if (target.id === 'fg-panel-close' || target.closest('#fg-panel-close')) {
        e.preventDefault();
        e.stopPropagation();
        this.close();
        return;
      }

      if (target.id === 'fg-backdrop') {
        e.preventDefault();
        e.stopPropagation();
        this.close();
        return;
      }

      const tabBtn = target.closest('.fg-tab-btn') as HTMLElement | null;
      if (tabBtn) {
        const tab = tabBtn.getAttribute('data-tab') as any;
        if (tab && tab !== this.activeTab) {
          e.preventDefault();
          e.stopPropagation();
          this.activeTab = tab;
          this.render();
        }
        return;
      }
    } catch (err) {
      console.error('[FoodGuardian][analysis-panel] click handler error:', err);
    }
  };

  private close() {
    try {
      this.dispatchEvent(new CustomEvent('close-details', { bubbles: true, composed: true }));
    } catch {}
  }

  private render() {
    try {
      if (!this.analysisData) return;

      const data: any = this.analysisData as any;
      const product = data.product || {};
      const rating = data.rating || {};
      const summary = data.summary || {};
      const ingredients: any[] = Array.isArray(data.ingredients) ? data.ingredients : [];
      const additives: any[] = Array.isArray(data.additives) ? data.additives : [];
      const nutrition = data.nutrition || {};
      const regulatory_comparison = data.regulatory_comparison || {};
      const factors: any[] = Array.isArray(data.factors) ? data.factors : [];
      const evidence: any[] = Array.isArray(data.evidence) ? data.evidence : [];
      const rules = data.rules || {};

      const grade = rating.grade || 'C';
      const gradeClass = `fg-grade-${grade}`;
      const confidence = typeof rating.confidence === 'number' ? rating.confidence : 0;
      const confidenceLabel = confidence >= 0.85 ? 'High confidence' : confidence >= 0.60 ? 'Moderate confidence' : 'Low confidence';
      const productName = (product && typeof product.name === 'string') ? product.name : (product?.title || 'Product');
      const displayName = productName.length > 48 ? productName.slice(0, 48) + '...' : productName;
      const score = typeof rating.score === 'number' ? Math.round(rating.score) : 0;

      this.innerHTML = `
        <div class="fg-modal-backdrop" id="fg-backdrop">
          <div class="fg-modal-sheet" id="fg-sheet">
            <div class="fg-sheet-header">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div class="fg-grade-pill ${gradeClass}" style="width: 40px; height: 40px; font-size: 22px;">${grade}</div>
                <div>
                  <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">
                    ${displayName}
                  </h2>
                  <div style="display: flex; gap: 8px; font-size: 12px; color: #64748b;">
                    <span>Score: <strong>${score}/100</strong></span>
                    <span>•</span>
                    <span>${confidenceLabel}</span>
                    ${product.brand ? `<span>• Brand: ${product.brand}</span>` : ''}
                  </div>
                </div>
              </div>
              <button class="fg-icon-btn" id="fg-panel-close" style="width: 32px; height: 32px; font-size: 20px;">×</button>
            </div>

            <div class="fg-sheet-tabs">
              <button class="fg-tab-btn ${this.activeTab === 'overview' ? 'active' : ''}" data-tab="overview">Overview</button>
              <button class="fg-tab-btn ${this.activeTab === 'factors' ? 'active' : ''}" data-tab="factors">Why this rating?</button>
              <button class="fg-tab-btn ${this.activeTab === 'nutrition' ? 'active' : ''}" data-tab="nutrition">Nutrition</button>
              <button class="fg-tab-btn ${this.activeTab === 'ingredients' ? 'active' : ''}" data-tab="ingredients">Ingredients (${ingredients.length})</button>
              <button class="fg-tab-btn ${this.activeTab === 'additives' ? 'active' : ''}" data-tab="additives">Additives (${additives.length})</button>
              <button class="fg-tab-btn ${this.activeTab === 'regulatory' ? 'active' : ''}" data-tab="regulatory">India vs EU</button>
              <button class="fg-tab-btn ${this.activeTab === 'sources' ? 'active' : ''}" data-tab="sources">Sources</button>
            </div>

            <div class="fg-sheet-content">
              ${this.renderTabContent()}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      console.error('[FoodGuardian][analysis-panel] render crashed:', err);
      try {
        this.innerHTML = `
          <div class="fg-modal-backdrop" id="fg-backdrop">
            <div class="fg-modal-sheet" id="fg-sheet">
              <div class="fg-sheet-header">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="font-weight:700;">FoodGuardian</div>
                </div>
                <button class="fg-icon-btn" id="fg-panel-close" style="width: 32px; height: 32px; font-size: 20px;">×</button>
              </div>
              <div style="padding:24px;color:#dc2626;">Unable to display details. Please close and try again.</div>
            </div>
          </div>
        `;
      } catch {}
    }
  }

  private renderTabContent(): string {
    const data: any = (this.analysisData as any) || {};
    const rating = data.rating || {};
    const summary = data.summary || {};
    const ingredients: any[] = Array.isArray(data.ingredients) ? data.ingredients : [];
    const additives: any[] = Array.isArray(data.additives) ? data.additives : [];
    const nutrition = data.nutrition || {};
    const regulatory_comparison = data.regulatory_comparison || {};
    const factors: any[] = Array.isArray(data.factors) ? data.factors : [];
    const evidence: any[] = Array.isArray(data.evidence) ? data.evidence : [];
    const rules = data.rules || {};
    const regIndia: any[] = Array.isArray(regulatory_comparison?.india) ? regulatory_comparison.india : [];
    const regEu: any[] = Array.isArray(regulatory_comparison?.eu) ? regulatory_comparison.eu : [];
    const nutritionFlags: string[] = Array.isArray(nutrition?.flags) ? nutrition.flags : [];

    switch (this.activeTab) {
      case 'overview':
        return `
          <div>
            <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 12px;">Executive Summary</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
                <div style="font-size: 20px; font-weight: 800; color: #0f172a;">${summary?.ingredient_count ?? ingredients.length}</div>
                <div style="font-size: 12px; color: #64748b;">Ingredients</div>
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
                <div style="font-size: 20px; font-weight: 800; color: ${additives.length > 0 ? '#ea580c' : '#16a34a'};">${summary?.recognized_additives ?? additives.length}</div>
                <div style="font-size: 12px; color: #64748b;">Additives Detected</div>
              </div>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center;">
                <div style="font-size: 20px; font-weight: 800; color: #0f172a;">${typeof rating.score === 'number' ? Math.round(rating.score) : 0}</div>
                <div style="font-size: 12px; color: #64748b;">FoodGuardian Score</div>
              </div>
            </div>

            <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">Primary Observations</h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${nutritionFlags.map((f: string) => `
                <div style="padding: 10px 14px; background: #fff7ed; border-left: 4px solid #ea580c; border-radius: 6px; font-size: 13px;">
                  ⚠️ <strong>${f}</strong>: Detected in nutrition breakdown.
                </div>
              `).join('')}
              ${additives.length > 0 ? `
                <div style="padding: 10px 14px; background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 6px; font-size: 13px;">
                  ℹ️ <strong>Food Additives</strong>: ${additives.map((a: any) => `${a?.name || 'Additive'} (${a?.code || ''})`).join(', ')}.
                </div>
              ` : `
                <div style="padding: 10px 14px; background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 6px; font-size: 13px;">
                  ✓ <strong>Clean Formulation</strong>: No synthetic additives or preservatives identified.
                </div>
              `}
              ${(regIndia.some((r: any) => r?.status === 'not_authorized') || regEu.some((r: any) => r?.status === 'not_authorized')) ? `
                <div style="padding: 10px 14px; background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 6px; font-size: 13px;">
                  🛑 <strong>Regulatory Notice</strong>: Contains substance not authorized in one of the compared jurisdictions.
                </div>
              ` : ''}
            </div>
          </div>
        `;

      case 'factors':
        return `
          <div>
            <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 6px;">Why This Rating?</h3>
            <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">
              FoodGuardian calculates scores using a deterministic 5-factor model evaluating nutrition, additives, cross-jurisdiction regulatory alignment, transparency, and allergens.
            </p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
              ${factors.map((f: any) => {
                const delta = typeof f?.score_delta === 'number' ? f.score_delta : 0;
                return `
                <div class="fg-factor-card ${f?.impact || 'neutral'}">
                  <div style="font-weight: 800; font-size: 15px; min-width: 44px; color: ${delta > 0 ? '#16a34a' : delta < 0 ? '#dc2626' : '#64748b'};">
                    ${delta > 0 ? `+${delta}` : delta}
                  </div>
                  <div style="flex: 1;">
                    <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${f?.factor_name || 'Factor'}</div>
                    <div style="font-size: 12px; color: #475569; margin-top: 2px;">${f?.reason || ''}</div>
                    ${f?.evidence ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">Source: ${f.evidence}</div>` : ''}
                  </div>
                </div>
              `;
              }).join('')}
            </div>
          </div>
        `;

      case 'nutrition':
        if (nutrition && nutrition.available === false) {
          return `
            <div style="text-align: center; padding: 40px 20px; color: #64748b;">
              <div style="font-size: 32px; margin-bottom: 12px;">📊</div>
              <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">Nutrition Facts Unavailable</h3>
              <p style="font-size: 13px;">The product page did not provide accessible nutrition tables or data.</p>
            </div>
          `;
        }
        const normEntries: [string, any][] = (nutrition && typeof nutrition.normalized === 'object' && nutrition.normalized !== null)
          ? Object.entries(nutrition.normalized)
          : [];
        return `
          <div>
            <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 6px;">Nutrition Profile (Per 100g)</h3>
            <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">
              Evaluated against WHO and FSSAI dietary benchmarks for packaged foods.
            </p>
            <div class="fg-table-wrap">
              <table class="fg-reg-table">
                <thead>
                  <tr>
                    <th>Nutrient</th>
                    <th>Value</th>
                    <th>Assessment</th>
                  </tr>
                </thead>
                <tbody>
                  ${normEntries.map(([key, rawVal]) => {
                    const label = key.replace(/_g_100g|_mg_100g|_kcal_100g/g, '').replace(/_/g, ' ').toUpperCase();
                    const unit = key.includes('_mg_') ? 'mg' : key.includes('_kcal_') ? 'kcal' : 'g';
                    const val = Number(rawVal) || 0;
                    let status = 'Standard';
                    if (key.includes('sugar') && val > 15) status = 'Elevated';
                    if (key.includes('saturated') && val > 5) status = 'Elevated';
                    if (key.includes('sodium') && val > 500) status = 'Elevated';
                    if (key.includes('fiber') && val >= 3) status = 'Good source';
                    return `
                      <tr>
                        <td><strong>${label}</strong></td>
                        <td>${val} ${unit}</td>
                        <td>
                          <span class="fg-status-tag ${status === 'Elevated' ? 'fg-status-condition_applies' : status === 'Good source' ? 'fg-status-authorized' : 'fg-status-unknown'}">
                            ${status}
                          </span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;

      case 'ingredients':
        return `
          <div>
            <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 6px;">Ingredient Intelligence</h3>
            <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">
              Ingredients parsed and normalized from the product declaration. Click on highlighted additives for regulatory background.
            </p>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; line-height: 1.8;">
              ${ingredients.map((ing: any) => `
                <span style="
                  display: inline-flex;
                  align-items: center;
                  gap: 4px;
                  padding: 4px 10px;
                  border-radius: 8px;
                  font-size: 12px;
                  ${ing?.is_additive 
                    ? 'background: #fef3c7; color: #92400e; border: 1px solid #fde68a; font-weight: 600;' 
                    : 'background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0;'};
                ">
                  ${ing?.name || ing || ''}
                  ${ing?.code ? `<span style="font-size: 10px; background: rgba(0,0,0,0.06); padding: 1px 4px; border-radius: 4px;">${ing.code}</span>` : ''}
                </span>
              `).join('')}
            </div>
          </div>
        `;

      case 'additives':
        if (additives.length === 0) {
          return `
            <div style="text-align: center; padding: 40px 20px; color: #64748b;">
              <div style="font-size: 32px; margin-bottom: 12px;">🌱</div>
              <h3 style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">No Additives Detected</h3>
              <p style="font-size: 13px;">No food colors, chemical preservatives, or synthetic additives were recognized in this product.</p>
            </div>
          `;
        }
        return `
          <div>
            <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 16px;">Detected Food Additives & E-Numbers</h3>
            <div style="display: flex; flex-direction: column; gap: 14px;">
              ${additives.map((add: any) => {
                const inStatus = add?.regulatory_status?.india || 'unknown';
                const euStatus = add?.regulatory_status?.eu || 'unknown';
                return `
                <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; background: #ffffff;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <div>
                      <h4 style="font-size: 14px; font-weight: 700; color: #0f172a;">${add?.name || 'Additive'}</h4>
                      <div style="font-size: 12px; color: #64748b;">Code: <strong>${add?.code || 'N/A'}</strong> ${add?.ins_code ? `(INS ${add.ins_code})` : ''} • Class: ${add?.functional_class || 'General'}</div>
                    </div>
                    <div style="display: flex; gap: 6px;">
                      <span class="fg-status-tag fg-status-${inStatus}">IN: ${inStatus}</span>
                      <span class="fg-status-tag fg-status-${euStatus}">EU: ${euStatus}</span>
                    </div>
                  </div>
                  <p style="font-size: 12px; color: #475569; margin-bottom: 8px;">${add?.description || 'Recognized food additive.'}</p>
                  ${add?.comparison_summary ? `
                    <div style="font-size: 11px; background: #f8fafc; border-left: 3px solid #64748b; padding: 6px 10px; border-radius: 4px; color: #334155;">
                      ⚖️ <strong>Regulatory comparison</strong>: ${add.comparison_summary}
                    </div>
                  ` : ''}
                </div>
              `;
              }).join('')}
            </div>
          </div>
        `;

      case 'regulatory':
        return `
          <div>
            <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 6px;">India vs European Union Food Safety Regulations</h3>
            <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">
              Factual comparison between Food Safety and Standards Authority of India (FSSAI) and European Union (Regulation EC 1333/2008 & 1169/2011).
            </p>
            <div class="fg-table-wrap">
              <table class="fg-reg-table">
                <thead>
                  <tr>
                    <th>Factor</th>
                    <th>India (FSSAI)</th>
                    <th>European Union (EU)</th>
                  </tr>
                </thead>
                <tbody>
                  ${additives.map((add: any) => {
                    const inStatus = add?.regulatory_status?.india || 'unknown';
                    const euStatus = add?.regulatory_status?.eu || 'unknown';
                    return `
                      <tr>
                        <td><strong>${add?.name || 'Additive'} (${add?.code || 'N/A'})</strong></td>
                        <td>
                          <span class="fg-status-tag fg-status-${inStatus}">${inStatus}</span>
                          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">FSSAI Standards</div>
                        </td>
                        <td>
                          <span class="fg-status-tag fg-status-${euStatus}">${euStatus}</span>
                          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Reg. (EC) No 1333/2008</div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <div style="margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 12px; color: #475569;">
              <strong>ℹ️ Note on Regulatory Differences:</strong> Regulatory divergence does not automatically mean a product is unsafe. Jurisdictions establish standards using differing dietary exposure assumptions, food category scopes, and statutory mandates.
            </div>
          </div>
        `;

      case 'sources':
        return `
          <div>
            <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 6px;">Sources & Methodology</h3>
            <p style="font-size: 13px; color: #64748b; margin-bottom: 16px;">
              Every FoodGuardian assessment is traceable to versioned official regulations and documented scoring rules.
            </p>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <div style="font-weight: 700; font-size: 13px;">Regulatory Knowledge Snapshot: ${rules?.regulatory_version || '2026-08'}</div>
                <div style="font-size: 12px; color: #64748b;">Consolidated FSSAI Standards & EU EUR-Lex Regulations</div>
              </div>
              <div style="padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <div style="font-weight: 700; font-size: 13px;">Scoring Methodology: Version ${rules?.scoring_version || '1.0'}</div>
                <div style="font-size: 12px; color: #64748b;">Weights: Nutrition 40%, Additives 20%, Regulatory 20%, Transparency 10%, Allergens 10%</div>
              </div>
              <h4 style="font-size: 13px; font-weight: 600; margin-top: 8px;">Official Evidence Links:</h4>
              <ul style="padding-left: 20px; font-size: 12px; color: #2563eb; display: flex; flex-direction: column; gap: 6px;">
                <li><a href="https://eur-lex.europa.eu/eli/reg/2008/1333/2026-08-18/eng" target="_blank" rel="noopener noreferrer">Regulation (EC) No 1333/2008 on Food Additives (EUR-Lex)</a></li>
                <li><a href="https://eur-lex.europa.eu/eli/reg/2011/1169/2025-05-01/eng" target="_blank" rel="noopener noreferrer">Regulation (EU) No 1169/2011 on Food Information to Consumers</a></li>
                <li><a href="https://fssai.gov.in/food-law/regulations/compendium/food-products-standards" target="_blank" rel="noopener noreferrer">FSSAI Food Products Standards & Food Additives Compendium</a></li>
                <li><a href="https://www.fssai.gov.in/upload/uploadfiles/files/Compendium_Labelling_Display_17_10_2022.pdf" target="_blank" rel="noopener noreferrer">FSSAI Labelling and Display Regulations</a></li>
              </ul>
            </div>
          </div>
        `;
    }
  }
}

customElements.define('fg-analysis-panel', FgAnalysisPanel);
