import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProcessesService } from '../../services/processes.service';
import { ToastService } from '../../services/toast.service';
import { SettingsService } from '../../services/settings.service';
import { StageOptionsService } from '../../services/stage-options.service';
import countriesData from '../../../assets/countries.json';
import { HasUnsavedChanges } from '../../guards/unsaved-changes.guard';

@Component({
    selector: 'app-process-edit',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './process-edit.component.html',
    styleUrls: ['./process-edit.component.css']
})
export class ProcessEditComponent implements OnInit, HasUnsavedChanges {
    @ViewChild('processForm') processForm!: NgForm;
    submitted = false;
    process: any;
    locationSearch = '';
    showLocationDropdown = false;

    // Character limits
    dataFromCallMaxLength = 500;
    initialInviteContentMaxLength = 1000;

    // Form progress
    get formProgress(): number {
        if (!this.process) return 0;
        const requiredFields = ['companyName', 'roleTitle', 'techStack', 'currentStage'];
        if (this.process.workMode !== 'remote') {
            requiredFields.push('location');
        }
        const filledFields = requiredFields.filter(field => this.process[field]?.toString().trim()).length;
        return Math.round((filledFields / requiredFields.length) * 100);
    }

    get progressColor(): string {
        if (this.formProgress < 40) return '#e74c3c';
        if (this.formProgress < 70) return '#f39c12';
        return '#2ecc71';
    }

    hasUnsavedChanges(): boolean {
        return !this.submitted && this.processForm?.dirty === true;
    }
    stages: string[] = [];
    newStageName = '';

    locationOptions: string[] = [];
    selectedCountry = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private processesService: ProcessesService,
        private toastService: ToastService,
        private settingsService: SettingsService,
        private stageOptionsService: StageOptionsService
    ) {
        this.stageOptionsService.refreshStages().subscribe({
            next: (res) => {
                this.stages = res.stages || [];
                if (this.process && !this.stages.includes(this.process.currentStage)) {
                    this.process.currentStage = this.stages[0] || this.stageOptionsService.lockedStage;
                }
            },
            error: () => {
                this.stages = this.stageOptionsService.defaultStages;
            }
        });

        const settings = this.settingsService.getSettings();
        this.selectedCountry = settings.country;
        this.locationOptions = this.getLocationsForCountry(settings.country);

        this.settingsService.settings$.subscribe(updatedSettings => {
            if (updatedSettings.country !== this.selectedCountry) {
                this.selectedCountry = updatedSettings.country;
                this.locationOptions = this.getLocationsForCountry(updatedSettings.country);
                if (this.process) {
                    this.process.location = '';
                }
                this.locationSearch = '';
                this.showLocationDropdown = false;
            }
        });
    }

    ngOnInit() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.processesService.getById(id).subscribe(data => {
            this.process = { ...data };
            // Remove relation fields that shouldn't be sent in update
            delete this.process.interactions;
            delete this.process.reviews;
            delete this.process.contacts;
            delete this.process._count;

            this.locationSearch = this.process.location || '';

            if (this.process.currentStage && !this.stages.includes(this.process.currentStage)) {
                this.process.currentStage = this.stages[0] || this.stageOptionsService.lockedStage;
            }
        });
    }

    private getLocationsForCountry(country: string): string[] {
        return country ? (countriesData as Record<string, string[]>)[country] ?? [] : [];
    }

    get filteredLocationOptions(): string[] {
        const term = this.locationSearch.trim().toLowerCase();
        if (!term) {
            return this.locationOptions;
        }

        return this.locationOptions.filter(location =>
            location.toLowerCase().includes(term)
        );
    }

    onLocationSearchChange() {
        this.showLocationDropdown = true;
    }

    toggleLocationDropdown() {
        this.showLocationDropdown = !this.showLocationDropdown;
    }

    selectLocation(location: string) {
        this.locationSearch = location;
        this.showLocationDropdown = false;
        this.process.location = location;
    }

    @HostListener('document:keydown', ['$event'])
    onDocumentKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' && this.showLocationDropdown && this.locationSearch.trim()) {
            const match = this.locationOptions.find(location =>
                location.toLowerCase() === this.locationSearch.trim().toLowerCase()
            );
            this.selectLocation(match ?? this.locationSearch.trim());
        }
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent) {
        const target = event.target as HTMLElement | null;
        if (!target?.closest('.location-combobox')) {
            this.showLocationDropdown = false;
        }
    }

    onWorkModeChange(event: any) {
        const selectedValue = event.target.value;
        // Clear daysFromOffice if not hybrid
        if (selectedValue !== 'hybrid') {
            this.process.daysFromOffice = null;
        }
        // Clear location if remote
        if (selectedValue === 'remote') {
            this.process.location = '';
            this.locationSearch = '';
        }
    }

    onSubmit() {
        if (this.processForm && !this.processForm.valid) {
            this.toastService.show('Please fill in all required fields.', 'warning');
            return;
        }

        // Validate required fields have non-empty values
        if (this.process.workMode !== 'remote' && (!this.process.location || this.process.location.trim() === '')) {
            this.toastService.show('Location is required for On-site/Hybrid roles.', 'warning');
            return;
        }

        const payload: any = {};

        // Allowed keys for the update DTO
        const whitelist = [
            'companyName', 'roleTitle', 'techStack', 'location', 'workMode',
            'daysFromOffice', 'source', 'salaryExpectation', 'salaryCurrency',
            'salaryPeriod', 'currentStage', 'dataFromThePhoneCall', 'nextFollowUp',
            'initialInviteDate', 'initialInviteMethod', 'initialInviteContent',
            'scoreTech', 'scoreWLB', 'scoreGrowth', 'scoreVibe',
            'baseSalary', 'equity', 'bonus', 'signingBonus', 'benefits', 'offerDeadline'
        ];

        // Only include non-empty values that are in the whitelist
        Object.keys(this.process).forEach(key => {
            const value = this.process[key];
            if (value !== null && value !== undefined && value !== '' && whitelist.includes(key)) {
                payload[key] = value;
            }
        });

        // Ensure dates are ISO
        if (payload.nextFollowUp) {
            payload.nextFollowUp = new Date(payload.nextFollowUp).toISOString();
        }
        if (payload.initialInviteDate) {
            payload.initialInviteDate = new Date(payload.initialInviteDate).toISOString();
        }
        if (payload.offerDeadline) {
            payload.offerDeadline = new Date(payload.offerDeadline).toISOString();
        }

        // Ensure numbers are numbers
        if (payload.salaryExpectation !== undefined) {
            payload.salaryExpectation = Number(payload.salaryExpectation);
        }

        if (payload.daysFromOffice !== undefined) {
            payload.daysFromOffice = Number(payload.daysFromOffice);
        }

        console.log('Submitting process edit:', payload);
        this.processesService.update(this.process.id, payload).subscribe({
            next: () => {
                console.log('Process updated successfully');
                this.submitted = true;
                this.toastService.show('Process updated successfully', 'success');
                this.router.navigate(['/process', this.process.id]);
            },
            error: (err) => {
                console.error('Error updating process:', err);

                let errorMessage = 'Unknown error';
                if (err.error) {
                    if (Array.isArray(err.error.message)) {
                        errorMessage = err.error.message.join(', ');
                        console.error('Validation errors:', err.error.message);
                    } else {
                        errorMessage = err.error.message || err.message;
                    }
                } else {
                    errorMessage = err.message;
                }

                console.error('Formatted Error Message:', errorMessage);
                this.toastService.show('Error updating process: ' + errorMessage, 'error');
            }
        });
    }

}
