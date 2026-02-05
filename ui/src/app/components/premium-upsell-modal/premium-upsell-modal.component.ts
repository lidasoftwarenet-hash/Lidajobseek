import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-premium-upsell-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upsell-overlay" *ngIf="open" (click)="onCancel()">
      <div class="upsell-card" (click)="$event.stopPropagation()">
        <div class="upsell-header">
          <div class="upsell-badge">Premium</div>
          <button class="upsell-close" (click)="onCancel()" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="upsell-hero">
          <div class="upsell-icon">🤖</div>
          <div>
            <h2 class="upsell-title">AI‑Powered CV Generation</h2>
            <p class="upsell-subtitle">Transform your profile into a recruiter‑ready CV in seconds.</p>
          </div>
        </div>
        <div class="upsell-body">
          <p class="upsell-message">
            Upgrade to Premium to unlock AI enhancements that elevate your summary, skills, and formatting with polished, ATS‑friendly language.
          </p>
          <div class="upsell-grid">
            <div class="upsell-feature">
              <div class="feature-icon">✨</div>
              <div>
                <h4>Polished Summary</h4>
                <p>Instantly refine your professional story with AI‑generated clarity.</p>
              </div>
            </div>
            <div class="upsell-feature">
              <div class="feature-icon">📈</div>
              <div>
                <h4>Skills Optimization</h4>
                <p>Highlight the most valuable skills tailored to your career path.</p>
              </div>
            </div>
            <div class="upsell-feature">
              <div class="feature-icon">🧩</div>
              <div>
                <h4>ATS‑Friendly Format</h4>
                <p>Improve readability and structure for automated screening systems.</p>
              </div>
            </div>
            <div class="upsell-feature">
              <div class="feature-icon">🎯</div>
              <div>
                <h4>Industry Tone</h4>
                <p>Use language that resonates with hiring managers in your field.</p>
              </div>
            </div>
          </div>
        </div>
        <div class="upsell-actions">
          <button class="btn-secondary" type="button" (click)="onCancel()">Not now</button>
          <button class="btn-primary" type="button" (click)="onUpgrade()">Upgrade to Premium</button>
        </div>
        <p class="upsell-footnote">Start with a 14‑day free trial • Cancel anytime</p>
      </div>
    </div>
  `,
  styles: [`
    .upsell-overlay {
      position: fixed;
      inset: 0;
      background: rgba(17, 24, 39, 0.55);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 11000;
      padding: 20px;
      animation: fadeIn 0.2s ease-out;
    }
    .upsell-card {
      position: relative;
      background: var(--bg-card);
      border-radius: 22px;
      padding: 32px;
      width: min(92vw, 640px);
      border: 1px solid rgba(148, 163, 184, 0.25);
      box-shadow: 0 25px 60px rgba(15, 23, 42, 0.25);
      animation: scaleIn 0.2s ease-out;
      overflow: hidden;
    }
    .upsell-card::before {
      content: '';
      position: absolute;
      inset: -60% 0 auto 0;
      height: 220px;
      background: radial-gradient(circle at top, rgba(59, 130, 246, 0.25), transparent 70%);
      opacity: 0.8;
    }
    .upsell-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
      position: relative;
      z-index: 1;
    }
    .upsell-badge {
      padding: 6px 14px;
      border-radius: 999px;
      background: linear-gradient(120deg, rgba(59, 130, 246, 0.25), rgba(129, 140, 248, 0.2));
      color: #3b82f6;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      font-size: 11px;
    }
    .upsell-close {
      background: rgba(148, 163, 184, 0.2);
      border: none;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      cursor: pointer;
    }
    .upsell-hero {
      display: flex;
      gap: 16px;
      align-items: center;
      position: relative;
      z-index: 1;
    }
    .upsell-icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(14, 165, 233, 0.25));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
    }
    .upsell-title {
      margin: 0 0 6px;
      font-size: 24px;
      color: var(--text-primary);
    }
    .upsell-subtitle {
      margin: 0;
      color: var(--text-secondary);
      font-size: 14.5px;
    }
    .upsell-body {
      margin-top: 18px;
      position: relative;
      z-index: 1;
    }
    .upsell-message {
      color: var(--text-secondary);
      margin-bottom: 20px;
      line-height: 1.7;
      font-size: 14.5px;
    }
    .upsell-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
    }
    .upsell-feature {
      display: flex;
      gap: 12px;
      padding: 14px;
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.04);
      border: 1px solid rgba(148, 163, 184, 0.2);
    }
    .upsell-feature h4 {
      margin: 0 0 4px;
      font-size: 14.5px;
      color: var(--text-primary);
    }
    .upsell-feature p {
      margin: 0;
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.4;
    }
    .feature-icon {
      width: 34px;
      height: 34px;
      border-radius: 12px;
      background: rgba(59, 130, 246, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }
    .upsell-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      position: relative;
      z-index: 1;
    }
    .upsell-actions .btn-primary,
    .upsell-actions .btn-secondary {
      min-width: 170px;
    }
    .upsell-footnote {
      margin-top: 12px;
      text-align: right;
      color: var(--text-secondary);
      font-size: 12.5px;
      position: relative;
      z-index: 1;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleIn {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class PremiumUpsellModalComponent {
  @Input() open = false;
  @Output() upgrade = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onUpgrade() {
    this.upgrade.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}