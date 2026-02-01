import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeyboardShortcutsService } from '../../services/keyboard-shortcuts.service';

@Component({
  selector: 'app-shortcuts-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="shortcuts-overlay" (click)="onClose()">
      <div class="shortcuts-modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div class="header-content">
            <div class="header-icon">⌨️</div>
            <div>
              <h2>Keyboard Shortcuts</h2>
              <p>Navigate faster with keyboard shortcuts</p>
            </div>
          </div>
          <button class="close-btn" (click)="onClose()" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="shortcuts-grid">
            <div *ngFor="let shortcut of shortcuts" class="shortcut-item">
              <span class="shortcut-description">{{ shortcut.description }}</span>
              <div class="shortcut-keys">
                <kbd *ngIf="shortcut.ctrl">Ctrl</kbd>
                <span *ngIf="shortcut.ctrl" class="key-separator">+</span>
                <kbd *ngIf="shortcut.alt">Alt</kbd>
                <span *ngIf="shortcut.alt" class="key-separator">+</span>
                <kbd *ngIf="shortcut.shift">Shift</kbd>
                <span *ngIf="shortcut.shift" class="key-separator">+</span>
                <kbd>{{ shortcut.key.toUpperCase() }}</kbd>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <p class="footer-hint">Press <kbd>?</kbd> anytime to view shortcuts</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shortcuts-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .shortcuts-modal {
      background: var(--bg-primary);
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 600px;
      width: 90vw;
      max-height: 80vh;
      overflow: hidden;
      animation: scaleIn 0.2s ease;
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .modal-header {
      padding: 24px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      background: linear-gradient(135deg, rgba(0, 120, 212, 0.05) 0%, rgba(16, 110, 190, 0.08) 100%);
    }

    .header-content {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .header-icon {
      font-size: 32px;
      line-height: 1;
    }

    .modal-header h2 {
      font-size: var(--font-size-2xl);
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 4px 0;
    }

    .modal-header p {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin: 0;
    }

    .close-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      color: var(--text-secondary);
      padding: 4px;
      border-radius: var(--radius-md);
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
      transform: rotate(90deg);
    }

    .modal-body {
      padding: 24px;
      max-height: 60vh;
      overflow-y: auto;
    }

    .shortcuts-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .shortcut-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
      transition: all 0.2s ease;
    }

    .shortcut-item:hover {
      background: var(--bg-hover);
      transform: translateX(4px);
    }

    .shortcut-description {
      font-size: var(--font-size-base);
      color: var(--text-primary);
      font-weight: 500;
    }

    .shortcut-keys {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .key-separator {
      color: var(--text-tertiary);
      font-weight: 600;
      font-size: 12px;
    }

    kbd {
      min-width: 32px;
      text-align: center;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--border-color);
      background: var(--bg-secondary);
      text-align: center;
    }

    .footer-hint {
      margin: 0;
      font-size: var(--font-size-sm);
      color: var(--text-tertiary);
    }

    @media (max-width: 640px) {
      .shortcuts-modal {
        width: 95vw;
        max-height: 90vh;
      }

      .modal-header,
      .modal-body,
      .modal-footer {
        padding: 16px;
      }

      .shortcut-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .shortcut-keys {
        align-self: flex-end;
      }
    }
  `]
})
export class ShortcutsModalComponent {
  @Output() close = new EventEmitter<void>();
  shortcuts: any[] = [];

  constructor(private keyboardService: KeyboardShortcutsService) {
    this.shortcuts = this.keyboardService.getShortcuts();
  }

  onClose() {
    this.close.emit();
  }
}
