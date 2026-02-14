import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" *ngIf="options$ | async as options" (click)="onOverlayClick($event)">
      <div class="dialog" (click)="$event.stopPropagation()">
        <div class="dialog-header">
           <div class="title-with-icon">
              <span class="warning-icon" *ngIf="options.title?.includes('⚠️')">⚠️</span>
              <h3 class="dialog-title">{{ options.title?.replace('⚠️', '') }}</h3>
           </div>
          <button class="dialog-close" (click)="onCancel()" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="dialog-body">
           <p class="dialog-message">{{ options.message }}</p>
        </div>
        <div class="dialog-actions">
          <ng-container *ngIf="options.buttons; else defaultButtons">
            <button *ngFor="let btn of options.buttons"
                    [class]="'dialog-btn ' + (btn.class || 'btn-secondary')"
                    (click)="onCustom(btn.value)">
              {{ btn.text }}
            </button>
          </ng-container>
          <ng-template #defaultButtons>
            <button class="dialog-btn btn-secondary" (click)="onCancel()">{{ options.cancelText }}</button>
            <button class="dialog-btn btn-primary" (click)="onConfirm()">{{ options.confirmText }}</button>
          </ng-template>
        </div>
        <div class="keyboard-hint">Press <kbd>ESC</kbd> to dismiss</div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 20px;
      animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .dialog {
      background: #ffffff;
      padding: 32px;
      border-radius: 20px;
      width: min(94vw, 440px);
      box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(226, 232, 240, 0.8);
      animation: dialogIntro 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
    }
    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .title-with-icon {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .warning-icon {
        font-size: 24px;
        animation: pulseHeart 1.5s infinite;
    }
    .dialog-title {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 800;
      color: #1e293b;
      letter-spacing: -0.01em;
    }
    .dialog-close {
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 4px;
        border-radius: 8px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .dialog-close:hover {
        background: #f1f5f9;
        color: #475569;
    }
    .dialog-message {
      margin-bottom: 32px;
      color: #475569;
      line-height: 1.6;
      font-size: 15px;
      font-weight: 500;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .dialog-btn {
      padding: 12px 24px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
      min-width: 120px;
    }
    .btn-secondary {
        background: #f1f5f9;
        color: #475569;
    }
    .btn-secondary:hover {
        background: #e2e8f0;
        transform: translateY(-1px);
    }
    .btn-primary {
        background: #3b82f6;
        color: white;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
    }
    .btn-primary:hover {
        background: #2563eb;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35);
    }
    .btn-danger {
        background: #ef4444;
        color: white;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
    }
    .btn-danger:hover {
        background: #dc2626;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(239, 68, 68, 0.35);
    }
    .keyboard-hint {
        position: absolute;
        bottom: -30px;
        left: 0;
        right: 0;
        text-align: center;
        font-size: 11px;
        color: rgba(255, 255, 255, 0.7);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    kbd {
        background: rgba(255,255,255,0.2);
        padding: 2px 4px;
        border-radius: 4px;
        border: 1px solid rgba(255,255,255,0.3);
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes dialogIntro {
      from { transform: scale(0.95) translateY(10px); opacity: 0; }
      to { transform: scale(1) translateY(0); opacity: 1; }
    }
    @keyframes pulseHeart {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.15); }
    }
  `]
})
export class ConfirmDialogComponent {
  options$;

  constructor(public confirmService: ConfirmService) {
    this.options$ = this.confirmService.confirmState$;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(_event: KeyboardEvent) {
    this.onCancel();
  }

  onOverlayClick(_event: MouseEvent) {
    // Click outside to dismiss
    this.onCancel();
  }

  onConfirm() {
    this.confirmService.resolve(true);
  }

  onCancel() {
    this.confirmService.resolve(false);
  }

  onCustom(value: any) {
    this.confirmService.resolve(value);
  }
}
