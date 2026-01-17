import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProcessesService } from '../../services/processes.service';
import { InteractionsService } from '../../services/interactions.service';
import { ReviewsService } from '../../services/reviews.service';
import { ContactsService } from '../../services/contacts.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-process-details',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './process-details.component.html'
})
export class ProcessDetailsComponent implements OnInit {
    process: any;
    showContactForm = false;
    newContact: any = {
        name: '',
        role: '',
        linkedIn: '',
        email: '',
        socialHooks: ''
    };

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private processesService: ProcessesService,
        private interactionsService: InteractionsService,
        private reviewsService: ReviewsService,
        private contactsService: ContactsService
    ) { }

    ngOnInit() {
        this.loadProcess();
    }

    loadProcess() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (id) {
            this.processesService.getById(id).subscribe(data => {
                this.process = data;
            });
        }
    }

    deleteProcess() {
        if (confirm('Are you sure you want to delete this whole process? This cannot be undone.')) {
            this.processesService.delete(this.process.id).subscribe(() => {
                this.router.navigate(['/']);
            });
        }
    }

    deleteInteraction(id: number) {
        if (confirm('Delete this interaction?')) {
            this.interactionsService.delete(id).subscribe(() => {
                this.loadProcess();
            });
        }
    }

    deleteReview(id: number) {
        if (confirm('Delete this self-review?')) {
            this.reviewsService.delete(id).subscribe(() => {
                this.loadProcess();
            });
        }
    }

    addContact() {
        if (!this.newContact.name) return;

        const contactData = {
            ...this.newContact,
            processId: this.process.id
        };

        this.contactsService.create(contactData).subscribe(() => {
            this.loadProcess();
            this.showContactForm = false;
            this.newContact = { name: '', role: '', linkedIn: '', email: '', socialHooks: '' };
        });
    }

    deleteContact(id: number) {
        if (confirm('Delete this contact?')) {
            this.contactsService.delete(id).subscribe(() => {
                this.loadProcess();
            });
        }
    }

    getStatusClass(stage: string): string {
        if (!stage) return '';
        return 'status-' + stage.toLowerCase().replace(' ', '-');
    }
}
