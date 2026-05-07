import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ProcessesService } from '../../services/processes.service';
import { ToastService } from '../../services/toast.service';
import { DEFAULT_PROCESS_STAGE } from '../../shared/process-stages';
import { ProcessFormComponent } from '../../components/process-form/process-form.component';

@Component({
    selector: 'app-process-create',
    standalone: true,
    imports: [CommonModule, RouterModule, ProcessFormComponent],
    template: `
      <div class="page-wrapper">
        <app-process-form
          [process]="process"
          [isSubmitting]="loading"
          (onSubmit)="onSubmit()"
          (onCancel)="onCancel()">
        </app-process-form>
      </div>
    `,
    styles: [`
      .page-wrapper {
        min-height: 100vh;
        background: var(--bg-secondary);
      }
    `],
})
export class ProcessCreateComponent {
    loading: boolean = false;

    process: any = {
        companyName: '',
        roleTitle: '',
        techStack: '',
        location: 'Israel',
        workMode: 'remote',
        daysFromOffice: null,
        source: '',
        salaryExpectation: '',
        salaryCurrency: 'ILS',
        salaryPeriod: 'Month',
        currentStage: DEFAULT_PROCESS_STAGE,
        companyWebsite: '',
        companyLogoUrl: '',
        jobDescriptionUrl: '',
        scoreTech: 3,
        scoreGrowth: 3,
        scoreWLB: 3,
        scoreVibe: 3,
        tailoredPitch: ''
    };

    constructor(
        private processesService: ProcessesService,
        private router: Router,
        private toastService: ToastService
    ) {}

    onSubmit() {
        this.loading = true;
        this.processesService.create(this.process).subscribe({
            next: () => {
                this.toastService.show('Process created successfully', 'success');
                this.loading = false;
                this.router.navigate(['/']);
            },
            error: (err) => {
                this.toastService.show('Error creating process: ' + (err.error?.message || err.message), 'error');
                this.loading = false;
            }
        });
    }

    onCancel() {
        this.router.navigate(['/']);
    }
}

