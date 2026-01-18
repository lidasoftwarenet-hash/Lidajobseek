import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InteractionsService } from '../../services/interactions.service';
import { ProcessesService } from '../../services/processes.service';

@Component({
    selector: 'app-interaction-edit',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './interaction-edit.component.html',
    styleUrls: ['./interaction-edit.component.css']
})
export class InteractionEditComponent implements OnInit {
    interaction: any;
    processId!: number;
    availableRoles = ['HR', 'Tech Lead', 'Team Member', 'Team Lead', 'Manager', 'CTO', 'Director', 'Group Leader', 'Architect'];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private interactionsService: InteractionsService,
        private processesService: ProcessesService
    ) { }

    ngOnInit() {
        this.processId = Number(this.route.snapshot.paramMap.get('pid'));
        const id = Number(this.route.snapshot.paramMap.get('id'));

        // We can't easily get a single interaction by ID from the API yet,
        // so we fetch the whole process and find it.
        // Or we add a Get by ID for interactions.
        // Let's just fetch it from the process for now.
        this.processesService.getById(this.processId).subscribe(data => {
            const inter = data.interactions.find((i: any) => i.id === id);
            if (inter) {
                this.interaction = { ...inter };
                // Format date for datetime-local
                const d = new Date(this.interaction.date);
                const tzOffset = d.getTimezoneOffset() * 60000;
                this.interaction.date = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
            }
        });
    }

    addParticipant() {
        this.interaction.participants.push({ role: 'HR', name: '' });
    }

    removeParticipant(index: number) {
        this.interaction.participants.splice(index, 1);
    }

    onSubmit() {
        const payload = { ...this.interaction };
        payload.date = new Date(this.interaction.date).toISOString();

        this.interactionsService.update(this.interaction.id, payload).subscribe(() => {
            this.router.navigate(['/process', this.processId]);
        });
    }
}
