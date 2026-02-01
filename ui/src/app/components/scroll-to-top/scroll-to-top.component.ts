import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scroll-to-top',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      *ngIf="isVisible"
      class="scroll-to-top-btn"
      (click)="scrollToTop()"
      aria-label="Scroll to top"
      title="Scroll to top (Ctrl + Up)">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="19" x2="12" y2="5"></line>
        <polyline points="5 12 12 5 19 12"></polyline>
      </svg>
    </button>
  `,
  styles: [`
    .scroll-to-top-btn {
      position: fixed;
      bottom: 32px;
      right: 32px;
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-blue-dark) 100%);
      color: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(0, 120, 212, 0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 999;
      animation: slideInUp 0.3s ease;
    }

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .scroll-to-top-btn:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 120, 212, 0.4);
    }

    .scroll-to-top-btn:active {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 120, 212, 0.3);
    }

    .scroll-to-top-btn:focus-visible {
      outline: 2px solid var(--primary-blue);
      outline-offset: 4px;
    }

    @media (max-width: 768px) {
      .scroll-to-top-btn {
        bottom: 24px;
        right: 24px;
        width: 44px;
        height: 44px;
      }
    }
  `]
})
export class ScrollToTopComponent {
  isVisible = false;

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isVisible = window.pageYOffset > 300;
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboard(event: KeyboardEvent) {
    // Ctrl + Up Arrow to scroll to top
    if (event.ctrlKey && event.key === 'ArrowUp') {
      event.preventDefault();
      this.scrollToTop();
    }
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}
