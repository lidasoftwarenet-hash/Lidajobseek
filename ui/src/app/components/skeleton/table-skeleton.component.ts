import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from './skeleton.component';

@Component({
  selector: 'app-table-skeleton',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="table-skeleton">
      <div class="skeleton-table">
        <!-- Header -->
        <div class="skeleton-header">
          <div *ngFor="let col of columns" class="skeleton-header-cell">
            <app-skeleton type="text" [width]="col.width || '100%'" height="16px"></app-skeleton>
          </div>
        </div>

        <!-- Rows -->
        <div *ngFor="let row of rowsArray" class="skeleton-row">
          <div *ngFor="let col of columns" class="skeleton-cell">
            <app-skeleton
              [type]="getSkeletonType(col.type)"
              [width]="col.width || '100%'"
              [height]="col.height || '16px'">
            </app-skeleton>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .table-skeleton {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    .skeleton-table {
      width: 100%;
    }

    .skeleton-header {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: var(--space-md);
      padding: var(--space-md) var(--space-lg);
      background: var(--bg-tertiary);
      border-bottom: 1px solid var(--border-color);
    }

    .skeleton-header-cell {
      display: flex;
      align-items: center;
    }

    .skeleton-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: var(--space-md);
      padding: var(--space-md) var(--space-lg);
      border-bottom: 1px solid var(--border-color);
    }

    .skeleton-row:last-child {
      border-bottom: none;
    }

    .skeleton-cell {
      display: flex;
      align-items: center;
    }
  `]
})
export class TableSkeletonComponent {
  @Input() rows: number = 5;
  @Input() columns: Array<{width?: string, type?: string, height?: string}> = [
    { width: '200px' },
    { width: '150px' },
    { width: '120px' },
    { width: '100px' },
    { width: '80px' }
  ];

  get rowsArray() {
    return Array(this.rows).fill(0);
  }

  getSkeletonType(type?: string): 'text' | 'title' | 'avatar' | 'button' | 'card' {
    const validTypes: ('text' | 'title' | 'avatar' | 'button' | 'card')[] = ['text', 'title', 'avatar', 'button', 'card'];
    return validTypes.includes(type as any) ? type as any : 'text';
  }
}
