export const COMPONENT_STYLES = `
:host {
  --fg-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --fg-bg-surface: #ffffff;
  --fg-bg-glass: rgba(255, 255, 255, 0.95);
  --fg-border: #e2e8f0;
  --fg-text-primary: #0f172a;
  --fg-text-secondary: #475569;
  --fg-text-muted: #94a3b8;
  
  --fg-grade-a: #16a34a;
  --fg-grade-b: #65a30d;
  --fg-grade-c: #d97706;
  --fg-grade-d: #ea580c;
  --fg-grade-e: #dc2626;
  --fg-grade-f: #991b1b;
  
  --fg-shadow-lg: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
  --fg-shadow-xl: 0 20px 35px -5px rgba(0, 0, 0, 0.18), 0 10px 15px -5px rgba(0, 0, 0, 0.10);
  --fg-radius-md: 12px;
  --fg-radius-lg: 16px;
  --fg-radius-full: 9999px;
  
  font-family: var(--fg-font-family);
  font-size: 14px;
  line-height: 1.5;
  color: var(--fg-text-primary);
  box-sizing: border-box;
}

*, *::before, *::after {
  box-sizing: inherit;
  margin: 0;
  padding: 0;
}

/* Floating Card Container */
.fg-card-root {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 2147483647;
  width: 320px;
  background: var(--fg-bg-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--fg-border);
  border-radius: var(--fg-radius-lg);
  box-shadow: var(--fg-shadow-lg);
  overflow: hidden;
  transition: transform 0.2s ease, opacity 0.2s ease;
  user-select: none;
}

.fg-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid var(--fg-border);
}

.fg-logo-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 14px;
  color: #0f172a;
}

.fg-shield-icon {
  width: 20px;
  height: 20px;
  background: #16a34a;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 11px;
  font-weight: 900;
}

.fg-card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.fg-icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fg-text-secondary);
  transition: background 0.15s;
}

.fg-icon-btn:hover {
  background: #e2e8f0;
}

.fg-card-body {
  padding: 16px;
}

.fg-rating-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.fg-grade-pill {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 800;
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

.fg-grade-A { background: var(--fg-grade-a); }
.fg-grade-B { background: var(--fg-grade-b); }
.fg-grade-C { background: var(--fg-grade-c); }
.fg-grade-D { background: var(--fg-grade-d); }
.fg-grade-E { background: var(--fg-grade-e); }
.fg-grade-F { background: var(--fg-grade-f); }
.fg-grade-NR { background: #64748b; font-size: 14px; }

.fg-rating-meta {
  display: flex;
  flex-direction: column;
}

.fg-rating-title {
  font-weight: 700;
  font-size: 15px;
  color: var(--fg-text-primary);
}

.fg-rating-subtitle {
  font-size: 12px;
  color: var(--fg-text-secondary);
}

.fg-insights-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.fg-insight-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--fg-text-secondary);
}

.fg-cta-btn {
  width: 100%;
  padding: 9px 14px;
  background: #0f172a;
  color: #ffffff;
  border: none;
  border-radius: var(--fg-radius-md);
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.fg-cta-btn:hover {
  background: #1e293b;
}

/* Modal Side-Sheet Container */
.fg-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 2147483647;
  display: flex;
  justify-content: flex-end;
  animation: fgFadeIn 0.2s ease-out;
}

.fg-modal-sheet {
  width: 620px;
  max-width: 95vw;
  height: 100vh;
  background: var(--fg-bg-surface);
  box-shadow: var(--fg-shadow-xl);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fgSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fgFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fgSlideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.fg-sheet-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--fg-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
}

.fg-sheet-tabs {
  display: flex;
  padding: 0 24px;
  border-bottom: 1px solid var(--fg-border);
  background: #ffffff;
  overflow-x: auto;
  gap: 8px;
}

.fg-tab-btn {
  padding: 12px 14px;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 600;
  color: var(--fg-text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: all 0.15s;
}

.fg-tab-btn.active {
  color: #0f172a;
  border-bottom-color: #16a34a;
}

.fg-sheet-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Regulatory Comparison Tables */
.fg-table-wrap {
  width: 100%;
  border: 1px solid var(--fg-border);
  border-radius: var(--fg-radius-md);
  overflow: hidden;
  margin-top: 10px;
}

.fg-reg-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.fg-reg-table th {
  background: #f1f5f9;
  padding: 10px 14px;
  font-weight: 600;
  color: var(--fg-text-primary);
  border-bottom: 1px solid var(--fg-border);
}

.fg-reg-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
}

.fg-status-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--fg-radius-full);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.fg-status-authorized { background: #dcfce7; color: #166534; }
.fg-status-limit_applies { background: #fef9c3; color: #854d0e; }
.fg-status-condition_applies { background: #ffedd5; color: #9a3412; }
.fg-status-not_authorized { background: #fee2e2; color: #991b1b; }
.fg-status-unknown { background: #f1f5f9; color: #475569; }

/* Factor Cards */
.fg-factor-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--fg-radius-md);
  background: #f8fafc;
  border-left: 4px solid #cbd5e1;
}

.fg-factor-card.positive { border-left-color: var(--fg-grade-a); background: #f0fdf4; }
.fg-factor-card.negative { border-left-color: var(--fg-grade-e); background: #fef2f2; }

.fg-badge-pill {
  padding: 3px 8px;
  border-radius: var(--fg-radius-full);
  font-size: 11px;
  font-weight: 600;
}
`;
