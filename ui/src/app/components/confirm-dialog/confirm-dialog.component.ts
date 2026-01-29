import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService, ConfirmOptions } from '../../services/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay" *ngIf="options$ | async as options" (click)="onOverlayClick($event)">
      <div class="dialog" (click)="$event.stopPropagation()">
        <div class="dialog-header">
          <h3 class="dialog-title">{{ options.title }}</h3>
          <button class="dialog-close" (click)="onCancel()" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <p class="dialog-message">{{ options.message }}</p>
        <div class="dialog-actions">
          <ng-container *ngIf="options.buttons; else defaultButtons">
            <button *ngFor="let btn of options.buttons"
                    [class]="btn.class || 'btn-secondary'"
                    (click)="onCustom(btn.value)">
              {{ btn.text }}
            </button>
          </ng-container>
          <ng-template #defaultButtons>
            <button class="btn-secondary" (click)="onCancel()">{{ options.cancelText }}</button>
            <button class="btn-primary" (click)="onConfirm()">{{ options.confirmText }}</button>
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
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.2s ease-out;
    }
    .dialog {
      background: var(--bg-card);
      padding: 24px;
      border-radius: var(--radius-md);
      width: 90%;
      max-width: 400px;
      box-shadow: var(--shadow-lg);
      animation: scaleIn 0.2s ease-out;
    }
    .dialog-title {
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 18px;
      font-weight: 600;
    }
    .dialog-message {
      margin-bottom: 24px;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class ConfirmDialogComponent {
  options$;

  constructor(public confirmService: ConfirmService) {
    this.options$ = this.confirmService.confirmState$;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    this.onCancel();
  }

  onOverlayClick(event: MouseEvent) {
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
