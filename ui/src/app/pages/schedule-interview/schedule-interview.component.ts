import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InteractionsService } from '../../services/interactions.service';
import { ProcessesService } from '../../services/processes.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { AuthService } from '../../services/auth.service';
import { HasUnsavedChanges } from '../../guards/unsaved-changes.guard';

interface DurationPreset {
  label: string;
  value: number;
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
export class ScheduleInterviewComponent implements OnInit, HasUnsavedChanges {
  @ViewChild('interviewForm') interviewForm!: NgForm;
  processes: any[] = [];
  submitted = false;
  loading = false;
  processSearch = '';
  filteredProcesses: any[] = [];
  showAdvancedOptions = false;
  showTemplates = false;

  interaction: any = {
    processId: null,
    date: '',
    interviewType: 'video call',
    otherInterviewType: '',
    duration: 60,
    location: '',
    locationType: 'Home',
    locationAddress: '',
    locationName: '',
    meetingLink: '',
    participants: [],
    summary: '',
    headsup: '',
    notes: '',
    testsAssessment: '',
    roleInsights: '',
    reminder: 60,
    premiumReminder: 0,
    preparationChecklist: [],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };

  availableRoles = ['HR', 'Tech Lead', 'Team Member', 'Team Lead', 'Manager', 'CTO', 'Director', 'Group Leader', 'Architect', 'Recruiter', 'VP Engineering', 'Senior Engineer'];
  interviewTypes = ['phone call', 'video call', 'home assignment', 'office interview', 'Other'];
  durationOptions = [15, 30, 45, 60, 90, 120, 180, 240, 480];
  reminderOptions = [
    { label: 'No reminder', value: 0 },
    { label: '15 minutes before', value: 15 },
    { label: '30 minutes before', value: 30 },
    { label: '1 hour before', value: 60 },
    { label: '2 hours before', value: 120 },
    { label: '1 day before', value: 1440 },
    { label: '2 days before', value: 2880 }
  ];

  durationPresets: DurationPreset[] = [];

  interviewTemplates: InterviewTemplate[] = [
    {
      name: 'Phone Screen',
      type: 'phone call',
      duration: 15,
      participants: [{ role: 'HR', name: '' }],
      summary: 'Initial phone screening'
    },
    {
      name: 'Technical Video Call',
      type: 'video call',
      duration: 60,
      participants: [{ role: 'Tech Lead', name: '' }],
      summary: 'Technical interview via video'
    },
    {
      name: 'Office Interview',
      type: 'office interview',
      duration: 120,
      participants: [{ role: 'Team Lead', name: '' }],
      summary: 'On-site interview at the office'
    },
    {
      name: 'Home Assignment',
      type: 'home assignment',
      duration: 180,
      participants: [{ role: 'Recruiter', name: '' }],
      summary: 'Technical home assignment task'
    }
  ];

  constructor(
    private processesService: ProcessesService,
    private interactionsService: InteractionsService,
    private router: Router,
    public toastService: ToastService,
    private confirmService: ConfirmService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.loadProcesses();
    this.generateDurationPresets();
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

  generateDurationPresets() {
    this.durationPresets = [
      { label: '30 minutes', value: 30 },
      { label: '45 minutes', value: 45 },
      { label: '1 hour', value: 60 },
      { label: '1.5 hour', value: 90 },
      { label: '4h', value: 240 },
      { label: '8h', value: 480 }
    ];
  }

  get isPremiumUser(): boolean {
    return this.authService.isPremiumUser();
  }

  applyDurationPreset(preset: DurationPreset) {
    this.interaction.duration = preset.value;
    this.toastService.show(`Duration set to ${preset.label}`, 'success');
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
        // Only show open processes (not Rejected or Withdrawn)
        this.processes = processes.filter((p: any) =>
          p.currentStage !== 'Rejected' && p.currentStage !== 'Withdrawn'
        );
      },
      error: (err: any) => {
        console.error('Failed to load processes', err);
        this.toastService.show('Failed to load processes', 'error');
      }
    });
  }

  onProcessSearchChange() {
    const searchTerm = this.processSearch.toLowerCase().trim();
    if (!searchTerm) {
      this.filteredProcesses = this.processes.slice(0, 10); // Show top 10 open naturally
      return;
    }

    this.filteredProcesses = this.processes
      .filter(process => {
        const companyName = process.companyName?.toLowerCase() || '';
        const roleTitle = process.roleTitle?.toLowerCase() || '';
        const stage = process.currentStage?.toLowerCase() || '';
        return companyName.includes(searchTerm) ||
          roleTitle.includes(searchTerm) ||
          stage.includes(searchTerm);
      });
  }

  toggleProcessDropdown(show: boolean) {
    if (show) {
      this.onProcessSearchChange();
      this.showProcessDropdown = true;
    } else {
      // Small delay to allow clicking an option before the dropdown closes
      setTimeout(() => this.showProcessDropdown = false, 200);
    }
  }

  showProcessDropdown = false;

  selectProcess(process: any) {
    this.interaction.processId = process.id;
    this.processSearch = `${process.companyName} - ${process.roleTitle}`;
    this.filteredProcesses = [];
    this.showProcessDropdown = false;
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
      'video call': 'https://zoom.us/j/meeting-id'
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

    // Construct location string based on type
    let finalLocation = this.interaction.locationType;
    if (this.interaction.locationType === 'Office') {
      finalLocation = `Office: ${this.interaction.locationAddress}`;
    } else if (this.interaction.locationType === 'Other') {
      finalLocation = `${this.interaction.locationName} - ${this.interaction.locationAddress}`;
    }

    const payload: any = {
      processId: Number(this.interaction.processId),
      date: new Date(this.interaction.date).toISOString(),
      interviewType: this.interaction.interviewType === 'Other' ? this.interaction.otherInterviewType : this.interaction.interviewType,
      duration: this.interaction.duration,
      participants: this.interaction.participants.filter((p: any) => p.name.trim()),
      summary: this.interaction.summary,
      reminder: this.interaction.reminder,
      timezone: this.interaction.timezone,
      location: finalLocation
    };
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
        this.submitted = true;
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

  onCancel() {
    this.router.navigate(['/calendar']);
  }

  hasUnsavedChanges(): boolean {
    return !this.submitted && (this.interviewForm?.dirty === true);
  }

  getDurationLabel(minutes: number): string {
    if (minutes === 480) return 'Full Day';
    if (minutes < 60) return `${minutes} min`;
    const hours = minutes / 60;
    if (hours === 1) return '1 hour';
    if (hours % 1 === 0) return `${hours} hours`;
    return `${hours} hours`; // Will show 1.5 etc
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
