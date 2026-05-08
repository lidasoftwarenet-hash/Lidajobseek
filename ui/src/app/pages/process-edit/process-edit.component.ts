import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProcessesService } from '../../services/processes.service';
import { ToastService } from '../../services/toast.service';
import { ProcessFormComponent } from '../../components/process-form/process-form.component';

@Component({
    selector: 'app-process-edit',
    standalone: true,
    imports: [CommonModule, RouterModule, ProcessFormComponent],
    template: `
      <div class="dashboard-wrapper">
        <div class="container py-5">
          <app-process-form 
            *ngIf="process"
            [process]="process" 
            [isEdit]="true"
            [isSubmitting]="isSubmitting"
            (onSubmit)="onSubmit()"
            (onCancel)="onCancel()">
          </app-process-form>
          <div *ngIf="!process" class="loading-state">
             <p>Loading application data...</p>
          </div>
        </div>
      </div>
    `,
    styles: [`
      .dashboard-wrapper {
        min-height: 100vh;
        background: var(--bg-secondary);
      }
      .loading-state {
        text-align: center;
        padding: 100px;
        color: var(--text-secondary);
      }
    `]
})
export class ProcessEditComponent implements OnInit {
    process: any;
    isSubmitting = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private processesService: ProcessesService,
        private toastService: ToastService
    ) {}

    ngOnInit() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.processesService.getById(id).subscribe(data => {
            this.process = { ...data };
            
            // Remove relation fields that shouldn't be sent in update
            delete this.process.interactions;
            delete this.process.reviews;
            delete this.process.contacts;
            delete this.process._count;
        });
    }

    onSubmit() {
        this.isSubmitting = true;
        this.processesService.update(this.process.id, this.process).subscribe({
            next: () => {
                this.isSubmitting = false;
                this.toastService.show('Process updated successfully', 'success');
                this.router.navigate(['/process', this.process.id]);
            },
            error: (err) => {
                this.isSubmitting = false;
                this.toastService.show('Error updating process: ' + (err.error?.message || err.message), 'error');
            }
        });
    }

    onCancel() {
        this.router.navigate(['/process', this.process.id]);
    }
}

