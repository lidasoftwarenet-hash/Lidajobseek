import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProcessesService } from '../../services/processes.service';

@Component({
    selector: 'app-process-create',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './process-create.component.html'
})
export class ProcessCreateComponent {
    @ViewChild('processForm') processForm!: NgForm;

    process: any = {
        companyName: '',
        roleTitle: '',
        techStack: '',
        location: '',
        workMode: 'remote',
        daysFromOffice: null,
        source: '',
        salaryExpectation: 35000, // Default salary
        currentStage: 'Initial Call Scheduled',
       dataFromThePhoneCall: '',
        initialInviteDate: '',
        initialInviteMethod: '',
        initialInviteContent: ''
    };

    selectedLocation: string = '';

    stages = [
        'Initial Call Scheduled',
        'Awaiting Next Interview (after Initial Call)',
        'Interview Scheduled',
        'Waiting for Interview Feedback',
        'Home Task Assigned',
        'References Requested',
        'Final HR Interview Scheduled',
        'Offer Received',
        'Withdrawn',
        'Rejected',
        'No Response (14+ Days)'
    ];

    locationOptions = [
        'Tel-Aviv',
        'Raanana',
        'Hod Hasharon',
        'Ramat hasharon',
        'Ramat Gan',
        'Givataiim',
        'Bnei Brak',
        'Netania',
        'Hertzlia',
        'Rosh Haain',
        'Petah Tikva',
        'Yowneam',
        'Haifa',
        'Shfaim',
        'Binyamina',
        'Cesaria',
        'Ramat-Tivon',
        'Krayot',
        'Abroad',
        'Other'
    ];

    constructor(
        private processesService: ProcessesService,
        private router: Router
    ) { }

    onLocationChange(event: any) {
        const selectedValue = event.target.value;
        
        // If selecting "Other", clear the location field to show placeholder
        if (selectedValue === 'Other') {
            this.process.location = '';
        } else if (selectedValue !== '') {
            // Set location to the selected value
            this.process.location = selectedValue;
        }
    }

    onWorkModeChange(event: any) {
        const selectedValue = event.target.value;
        // Clear daysFromOffice if not hybrid
        if (selectedValue !== 'hybrid') {
            this.process.daysFromOffice = null;
        }
    }

    onSubmit() {
        if (!this.processForm.valid) {
            alert('Please fill in all required fields.');
            return;
        }

        const payload = { ...this.process };

        // Ensure dates are ISO or null
        if (payload.nextFollowUp) {
            payload.nextFollowUp = new Date(payload.nextFollowUp).toISOString();
        } else {
            payload.nextFollowUp = null;
        }
        
        if (payload.initialInviteDate) {
            payload.initialInviteDate = new Date(payload.initialInviteDate).toISOString();
        } else {
            payload.initialInviteDate = null;
        }

        // Ensure numbers are numbers
        if (payload.salaryExpectation) {
            payload.salaryExpectation = Number(payload.salaryExpectation);
        }

        console.log('Submitting Process:', payload);

        this.processesService.create(payload).subscribe({
            next: () => {
                console.log('Success');
                this.router.navigate(['/']);
            },
            error: (err) => {
                console.error('Submission Failed:', err);
                alert('Error creating process: ' + (err.error?.message || err.message));
            }
        });
    }
}
