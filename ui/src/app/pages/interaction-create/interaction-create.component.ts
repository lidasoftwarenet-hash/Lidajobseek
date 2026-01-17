import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InteractionsService } from '../../services/interactions.service';

@Component({
    selector: 'app-interaction-create',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './interaction-create.component.html'
})
export class InteractionCreateComponent implements OnInit {
    processId!: number;
    interaction: any = {
        date: '',
        interviewType: 'zoom',
        participants: [], // array of { role: string, name: string }
        summary: '',
        testsAssessment: '', // Tests or technical assessments during interview
        roleInsights: '', // What was learned about the role
        notes: '',
        invitationExtended: null // 'yes', 'later', or 'no'
    };

    availableRoles = ['HR', 'Tech Lead', 'Team Member', 'Team Lead', 'Manager', 'CTO', 'Director', 'Group Leader', 'Architect'];

    addParticipant() {
        this.interaction.participants.push({ role: 'HR', name: '' });
    }

    removeParticipant(index: number) {
        this.interaction.participants.splice(index, 1);
    }

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private interactionsService: InteractionsService
    ) { }

    ngOnInit() {
        this.processId = Number(this.route.snapshot.paramMap.get('id'));
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        this.interaction.date = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    }

    onSubmit() {
        const payload = {
            ...this.interaction,
            processId: this.processId,
            date: new Date(this.interaction.date).toISOString()
        };
        this.interactionsService.create(payload).subscribe(() => {
            this.router.navigate(['/process', this.processId]);
        });
    }
}
