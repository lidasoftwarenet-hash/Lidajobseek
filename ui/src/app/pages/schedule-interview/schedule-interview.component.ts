import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InteractionsService } from '../../services/interactions.service';
import { ProcessesService } from '../../services/processes.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-schedule-interview',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './schedule-interview.component.html',
  styleUrls: ['./schedule-interview.component.css']
})
export class ScheduleInterviewComponent implements OnInit {
  processes: any[] = [];
  loading = false;

  interaction: any = {
    processId: null,
    date: '',
    interviewType: 'zoom',
    participants: [],
    summary: '',
    headsup: '',
    notes: '',
    testsAssessment: '',
    roleInsights: ''
  };

  availableRoles = ['HR', 'Tech Lead', 'Team Member', 'Team Lead', 'Manager', 'CTO', 'Director', 'Group Leader', 'Architect'];
  interviewTypes = ['call', 'zoom', 'frontal', 'home assigment', 'technical', 'hr', 'managerial'];

  constructor(
    private processesService: ProcessesService,
    private interactionsService: InteractionsService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadProcesses();

    // Set default date to now
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    this.interaction.date = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  }

  loadProcesses() {
    this.processesService.getAll().subscribe({
      next: (processes) => {
        this.processes = processes;
      },
      error: (err) => {
        console.error('Failed to load processes', err);
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
    if (!this.interaction.processId) {
      this.toastService.show('Please select a process', 'warning');
      return;
    }

    this.loading = true;

    // Prepare the payload with only the fields we want to send
    const payload: any = {
      processId: Number(this.interaction.processId),
      date: new Date(this.interaction.date).toISOString(),
      interviewType: this.interaction.interviewType,
      participants: this.interaction.participants,
      summary: this.interaction.summary
    };

    // Add optional fields only if they have values
    if (this.interaction.headsup) payload.headsup = this.interaction.headsup;
    if (this.interaction.notes) payload.notes = this.interaction.notes;
    if (this.interaction.testsAssessment) payload.testsAssessment = this.interaction.testsAssessment;
    if (this.interaction.roleInsights) payload.roleInsights = this.interaction.roleInsights;

    this.interactionsService.create(payload).subscribe({
      next: () => {
        this.toastService.show('Interview scheduled successfully', 'success');
        this.router.navigate(['/calendar']);
      },
      error: (err) => {
        console.error('Failed to schedule interview', err);
        this.toastService.show('Failed to schedule interview', 'error');
        this.loading = false;
      }
    });
  }

  onCancel() {
    this.router.navigate(['/calendar']);
  }
}
