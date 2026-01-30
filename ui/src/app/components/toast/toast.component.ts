import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toastService.toasts$ | async"
           class="toast"
           [ngClass]="toast.type"
           (click)="toastService.remove(toast.id)">
        {{ toast.message }}
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .toast {
      position: relative;
      padding: 14px 22px;
      border-radius: 14px;
      color: white;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.2px;
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.18);
      border: 1px solid rgba(255, 255, 255, 0.3);
      backdrop-filter: blur(8px);
      cursor: pointer;
      animation: slideIn 0.35s ease-out;
      min-width: 280px;
      overflow: hidden;
    }
    .toast::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(120deg, rgba(255, 255, 255, 0.2), transparent 60%);
      opacity: 0.6;
      pointer-events: none;
    }
    .toast::before {
      content: '';
      position: absolute;
      top: -20px;
      right: -30px;
      width: 120px;
      height: 120px;
      background: rgba(255, 255, 255, 0.25);
      filter: blur(35px);
      opacity: 0.4;
    }
    .success {
      background: linear-gradient(135deg, #10b981 0%, #22c55e 45%, #34d399 100%);
    }
    .success::before {
      background: rgba(255, 255, 255, 0.35);
    }
    .error { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); }
    .info { background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); }
    .warning { background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); }

    @keyframes slideIn {
      from { transform: translateX(120%) scale(0.95); opacity: 0; }
      to { transform: translateX(0) scale(1); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
}
