import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InteractionsService } from '../../services/interactions.service';
import { ProcessesService } from '../../services/processes.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';

interface TimePreset {
  label: string;
  value: Date;
}

interface InterviewTemplate {
  name: string;
  type: string;
  duration: number;
  participants: any[];
  summary: string;
}

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
  processSearch = '';
  filteredProcesses: any[] = [];
  showAdvancedOptions = false;
  showTemplates = false;

  interaction: any = {
    processId: null,
    date: '',
    interviewType: 'zoom',
    duration: 60,
    location: '',
    meetingLink: '',
    participants: [],
    summary: '',
    headsup: '',
    notes: '',
    testsAssessment: '',
    roleInsights: '',
    reminder: 60,
    preparationChecklist: [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };

  availableRoles = ['HR', 'Tech Lead', 'Team Member', 'Team Lead', 'Manager', 'CTO', 'Director', 'Group Leader', 'Architect', 'Recruiter', 'VP Engineering', 'Senior Engineer'];
  interviewTypes = ['call', 'zoom', 'teams', 'meet', 'frontal', 'home assignment', 'technical', 'hr', 'managerial', 'culture fit', 'panel'];
  durationOptions = [15, 30, 45, 60, 90, 120, 180, 240];
  reminderOptions = [
    { label: 'No reminder', value: 0 },
    { label: '15 minutes before', value: 15 },
    { label: '30 minutes before', value: 30 },
    { label: '1 hour before', value: 60 },
    { label: '2 hours before', value: 120 },
    { label: '1 day before', value: 1440 },
    { label: '2 days before', value: 2880 }
  ];

  timePresets: TimePreset[] = [];

  interviewTemplates: InterviewTemplate[] = [
    {
      name: 'HR Screening',
      type: 'hr',
      duration: 30,
      participants: [{ role: 'HR', name: '' }],
      summary: 'Initial screening to discuss background, expectations, and culture fit'
    },
    {
      name: 'Technical Interview',
      type: 'technical',
      duration: 90,
      participants: [{ role: 'Tech Lead', name: '' }],
      summary: 'Deep dive into technical skills, coding abilities, and problem-solving'
    },
    {
      name: 'Panel Interview',
      type: 'panel',
      duration: 120,
      participants: [
        { role: 'Tech Lead', name: '' },
        { role: 'Team Lead', name: '' },
        { role: 'Manager', name: '' }
      ],
      summary: 'Comprehensive evaluation with multiple team members'
    },
    {
      name: 'Final Round',
      type: 'managerial',
      duration: 60,
      participants: [{ role: 'Director', name: '' }],
      summary: 'Final discussion about role expectations, compensation, and next steps'
    }
  ];

  constructor(
    private processesService: ProcessesService,
    private interactionsService: InteractionsService,
    private router: Router,
    private toastService: ToastService,
    private confirmService: ConfirmService
  ) {}

  ngOnInit() {
    this.loadProcesses();
    this.generateTimePresets();
    this.setDefaultDateTime();
  }

  setDefaultDateTime() {
    const now = new Date();
    // Round to next 15 minutes
    const minutes = Math.ceil(now.getMinutes() / 15) * 15;
    now.setMinutes(minutes);
    now.setSeconds(0);
    now.setMilliseconds(0);

    const tzOffset = now.getTimezoneOffset() * 60000;
    this.interaction.date = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  }

  generateTimePresets() {
    const now = new Date();

    // Today at next hour
    const todayNextHour = new Date(now);
    todayNextHour.setHours(now.getHours() + 1, 0, 0, 0);

    // Tomorrow at 9 AM
    const tomorrow9am = new Date(now);
    tomorrow9am.setDate(now.getDate() + 1);
    tomorrow9am.setHours(9, 0, 0, 0);

    // Tomorrow at 2 PM
    const tomorrow2pm = new Date(now);
    tomorrow2pm.setDate(now.getDate() + 1);
    tomorrow2pm.setHours(14, 0, 0, 0);

    // Next Monday at 10 AM
    const nextMonday = new Date(now);
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    nextMonday.setHours(10, 0, 0, 0);

    // Next week same day
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    nextWeek.setHours(10, 0, 0, 0);

    this.timePresets = [
      { label: 'In 1 hour', value: todayNextHour },
      { label: 'Tomorrow at 9 AM', value: tomorrow9am },
      { label: 'Tomorrow at 2 PM', value: tomorrow2pm },
      { label: 'Next Monday at 10 AM', value: nextMonday },
      { label: 'Next week', value: nextWeek }
    ];
  }

  applyTimePreset(preset: TimePreset) {
    const tzOffset = preset.value.getTimezoneOffset() * 60000;
    this.interaction.date = new Date(preset.value.getTime() - tzOffset).toISOString().slice(0, 16);
    this.toastService.show(`Time set to ${preset.label}`, 'success');
  }

  applyTemplate(template: InterviewTemplate) {
    this.interaction.interviewType = template.type;
    this.interaction.duration = template.duration;
    this.interaction.participants = JSON.parse(JSON.stringify(template.participants));
    this.interaction.summary = template.summary;
    this.showTemplates = false;
    this.toastService.show(`Applied ${template.name} template`, 'success');
  }

  loadProcesses() {
    this.processesService.getAll().subscribe({
      next: (processes: any) => {
        this.processes = processes;
      },
      error: (err: any) => {
        console.error('Failed to load processes', err);
        this.toastService.show('Failed to load processes', 'error');
      }
    });
  }

  onProcessSearchChange() {
    if (!this.processSearch.trim()) {
      this.filteredProcesses = [];
      return;
    }

    const searchTerm = this.processSearch.toLowerCase();
    this.filteredProcesses = this.processes
      .filter(process => {
        const companyName = process.companyName?.toLowerCase() || '';
        const roleTitle = process.roleTitle?.toLowerCase() || '';
        return companyName.includes(searchTerm) || roleTitle.includes(searchTerm);
      })
      .slice(0, 8); // Limit to 8 results
  }

  selectProcess(process: any) {
    this.interaction.processId = process.id;
    this.processSearch = `${process.companyName} - ${process.roleTitle}`;
    this.filteredProcesses = [];
  }

  clearProcessSelection() {
    this.interaction.processId = null;
    this.processSearch = '';
    this.filteredProcesses = [];
  }

  addParticipant() {
    this.interaction.participants.push({ role: 'HR', name: '', email: '' });
  }

  removeParticipant(index: number) {
    this.interaction.participants.splice(index, 1);
  }

  addChecklistItem() {
    if (!this.interaction.preparationChecklist) {
      this.interaction.preparationChecklist = [];
    }
    this.interaction.preparationChecklist.push({ text: '', completed: false });
  }

  removeChecklistItem(index: number) {
    this.interaction.preparationChecklist.splice(index, 1);
  }

  generateMeetingLink() {
    const types: any = {
      'zoom': 'https://zoom.us/j/meeting-id',
      'teams': 'https://teams.microsoft.com/l/meetup-join/...',
      'meet': 'https://meet.google.com/xxx-xxxx-xxx'
    };

    this.interaction.meetingLink = types[this.interaction.interviewType] || '';
    if (this.interaction.meetingLink) {
      this.toastService.show('Meeting link template added', 'info');
    }
  }

  async onSubmit() {
    if (!this.interaction.processId) {
      this.toastService.show('Please select a process', 'warning');
      return;
    }

    // Validate date is not in the past
    const interviewDate = new Date(this.interaction.date);
    const now = new Date();
    if (interviewDate < now) {
      const confirmed = await this.confirmService.confirm(
        'The selected date and time is in the past. Do you want to continue?',
        'Past Date Selected'
      );
      if (!confirmed) return;
    }

    this.loading = true;

    const payload: any = {
      processId: Number(this.interaction.processId),
      date: new Date(this.interaction.date).toISOString(),
      interviewType: this.interaction.interviewType,
      duration: this.interaction.duration,
      participants: this.interaction.participants.filter((p: any) => p.name.trim()),
      summary: this.interaction.summary,
      reminder: this.interaction.reminder,
      timezone: this.interaction.timezone
    };

    // Add optional fields
    if (this.interaction.location) payload.location = this.interaction.location;
    if (this.interaction.meetingLink) payload.meetingLink = this.interaction.meetingLink;
    if (this.interaction.headsup) payload.headsup = this.interaction.headsup;
    if (this.interaction.notes) payload.notes = this.interaction.notes;
    if (this.interaction.testsAssessment) payload.testsAssessment = this.interaction.testsAssessment;
    if (this.interaction.roleInsights) payload.roleInsights = this.interaction.roleInsights;
    if (this.interaction.preparationChecklist?.length > 0) {
      payload.preparationChecklist = this.interaction.preparationChecklist.filter((item: any) => item.text.trim());
    }

    this.interactionsService.create(payload).subscribe({
      next: () => {
        this.toastService.show('Interview scheduled successfully', 'success');
        this.router.navigate(['/calendar']);
      },
      error: (err: any) => {
        console.error('Failed to save interview', err);
        this.toastService.show('Failed to save interview', 'error');
        this.loading = false;
      }
    });
  }

  async onCancel() {
    if (this.hasUnsavedChanges()) {
      const confirmed = await this.confirmService.confirm(
        'You have unsaved changes. Are you sure you want to leave?',
        'Unsaved Changes'
      );
      if (!confirmed) return;
    }
    this.router.navigate(['/calendar']);
  }

  hasUnsavedChanges(): boolean {
    // Simple check - in production, you'd compare with original values
    return this.interaction.summary?.trim().length > 0 ||
           this.interaction.participants.length > 0 ||
           this.interaction.notes?.trim().length > 0;
  }

  getDurationLabel(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  getEndTime(): string {
    if (!this.interaction.date || !this.interaction.duration) return '';
    const start = new Date(this.interaction.date);
    const end = new Date(start.getTime() + this.interaction.duration * 60000);
    return end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  copyMeetingLink() {
    if (this.interaction.meetingLink) {
      navigator.clipboard.writeText(this.interaction.meetingLink);
      this.toastService.show('Meeting link copied to clipboard', 'success');
    }
  }
}
