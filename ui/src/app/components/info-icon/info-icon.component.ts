import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipDirective } from '../../directives/tooltip.directive';

@Component({
  selector: 'app-info-icon',
  standalone: true,
  imports: [CommonModule, TooltipDirective],
  template: `
    <span
      class="info-icon"
      [appTooltip]="text"
      [tooltipPosition]="position"
      [attr.aria-label]="text">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    </span>
  `,
  styles: [`
    .info-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--primary-blue-light);
      color: var(--primary-blue);
      cursor: help;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .info-icon:hover {
      background: var(--primary-blue);
      color: white;
      transform: scale(1.1);
    }

    .info-icon svg {
      width: 14px;
      height: 14px;
    }

    body.dark-theme .info-icon {
      background: rgba(0, 134, 240, 0.2);
      color: var(--primary-blue);
    }

    body.dark-theme .info-icon:hover {
      background: var(--primary-blue);
      color: white;
    }
  `]
})
export class InfoIconComponent {
  @Input() text: string = '';
  @Input() position: 'top' | 'bottom' | 'left' | 'right' = 'top';
}
