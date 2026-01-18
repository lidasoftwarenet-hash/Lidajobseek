import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProcessesService } from '../../services/processes.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-process-edit',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './process-edit.component.html'
})
export class ProcessEditComponent implements OnInit {
    process: any;
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
        private route: ActivatedRoute,
        private router: Router,
        private processesService: ProcessesService,
        private toastService: ToastService
    ) { }

    ngOnInit() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.processesService.getById(id).subscribe(data => {
            this.process = { ...data };
            // Remove relation fields that shouldn't be sent in update
            delete this.process.interactions;
            delete this.process.reviews;
            delete this.process.contacts;
            delete this.process._count;

            // Set selectedLocation based on process location
            if (this.process.location) {
                if (this.locationOptions.includes(this.process.location)) {
                    this.selectedLocation = this.process.location;
                } else {
                    this.selectedLocation = 'Other';
                }
            }
        });
    }

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

        if (payload.offerDeadline) {
            payload.offerDeadline = new Date(payload.offerDeadline).toISOString();
        } else {
            payload.offerDeadline = null;
        }

        console.log('Submitting process edit:', payload);
        this.processesService.update(this.process.id, payload).subscribe({
            next: () => {
                console.log('Process updated successfully');
                this.toastService.show('Process updated successfully', 'success');
                this.router.navigate(['/process', this.process.id]);
            },
            error: (err) => {
                console.error('Error updating process:', err);
                this.toastService.show('Error updating process: ' + (err.error?.message || err.message), 'error');
            }
        });
    }
}
