import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProcessesService } from '../../services/processes.service';
import { InteractionsService } from '../../services/interactions.service';
import { ReviewsService } from '../../services/reviews.service';
import { ContactsService } from '../../services/contacts.service';
import { FormsModule } from '@angular/forms';
import { ConfirmService } from '../../services/confirm.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { SettingsService } from '../../services/settings.service';

interface FollowUpTemplate {
    id: string;
    name: string;
    variants: FollowUpVariant[];
}

interface FollowUpVariant {
    id: string;
    name: string;
    subject: string;
    body: string;
}

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

    followUpTemplates: FollowUpTemplate[] = this.buildFollowUpTemplates();
    selectedTemplateId: string = 'gentle-checkin';
    selectedVariantId: string = 'v1';
    generatedFollowUpSubject: string = '';
    generatedFollowUpMessage: string = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private processesService: ProcessesService,
        private interactionsService: InteractionsService,
        private reviewsService: ReviewsService,
        private contactsService: ContactsService,
        private confirmService: ConfirmService,
        private toastService: ToastService,
        private authService: AuthService,
        private settingsService: SettingsService
    ) { }

    ngOnInit() {
        this.loadProcess();
    }

    loadProcess() {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (id) {
            this.processesService.getById(id).subscribe(data => {
                this.process = data;
                this.generateFollowUpDraft();
            });
        }
    }

    get selectedTemplate(): FollowUpTemplate | undefined {
        return this.followUpTemplates.find(t => t.id === this.selectedTemplateId);
    }

    get selectedVariant(): FollowUpVariant | undefined {
        const template = this.selectedTemplate;
        if (!template) return undefined;
        return template.variants.find(v => v.id === this.selectedVariantId) || template.variants[0];
    }

    onTemplateChange() {
        const template = this.selectedTemplate;
        this.selectedVariantId = template?.variants?.[0]?.id || 'v1';
        this.generateFollowUpDraft();
    }

    onVariantChange() {
        this.generateFollowUpDraft();
    }

    setTemplate(templateId: string) {
        if (this.selectedTemplateId === templateId) return;
        this.selectedTemplateId = templateId;
        this.onTemplateChange();
    }

    setVariant(variantId: string) {
        if (this.selectedVariantId === variantId) return;
        this.selectedVariantId = variantId;
        this.onVariantChange();
    }

    generateFollowUpDraft() {
        const variant = this.selectedVariant;
        if (!variant || !this.process) return;

        const replacements: Record<string, string> = {
            company: this.process.companyName || 'the company',
            role: this.process.roleTitle || 'the role',
            techStack: this.process.techStack || 'my experience',
            contactFormal: this.getPrimaryContactName() || 'Hiring Manager',
            'user.name': this.getCurrentUserName()
        };

        this.generatedFollowUpSubject = this.applyTemplate(variant.subject, replacements);
        this.generatedFollowUpMessage = this.applyTemplate(variant.body, replacements);
    }

    private buildFollowUpTemplates(): FollowUpTemplate[] {
        const tones = [
            { id: 'v1', name: 'Formal & concise', intro: 'Thank you for your time and consideration regarding my candidacy.', expand: 'I remain highly interested in the role and available for any next step you find appropriate.', close: 'I would appreciate any update at your convenience.' },
            { id: 'v2', name: 'Executive tone', intro: 'I am writing to provide a professional follow-up on the recruitment process.', expand: 'The role strongly aligns with my background, and I am confident I can contribute quickly and effectively.', close: 'Please let me know if any additional details are required from my side.' },
            { id: 'v3', name: 'Value-first', intro: 'I would like to reiterate my strong interest in this opportunity.', expand: 'My practical experience in {{techStack}} can support your current goals from day one.', close: 'I would be glad to proceed according to your timeline.' },
            { id: 'v4', name: 'Relationship-focused', intro: 'I appreciated the opportunity to engage in this process with your organization.', expand: 'Our previous discussion reinforced my motivation to join and create meaningful impact in this role.', close: 'Thank you again for your consideration and guidance on next steps.' },
            { id: 'v5', name: 'Next-step drive', intro: 'I am following up to align on progress and the next stage of the process.', expand: 'I remain available for interviews, technical discussions, or any additional assessment.', close: 'Please feel free to share a convenient timeline.' },
            { id: 'v6', name: 'Strategic & senior', intro: 'I am reaching out with a brief strategic follow-up regarding this position.', expand: 'Based on what I learned so far, I see clear alignment between your priorities and my delivery experience.', close: 'I would welcome the opportunity to continue the process.' },
            { id: 'v7', name: 'Detailed professional', intro: 'Thank you for reviewing my application and time invested so far.', expand: 'I remain very motivated by the scope of the role and by the potential to contribute measurable results.', close: 'Kindly share any updates when available.' },
            { id: 'v8', name: 'Confident but respectful', intro: 'I am writing to respectfully follow up on my candidacy.', expand: 'I am confident that my combination of hands-on execution and ownership mindset will fit this position well.', close: 'I would appreciate the chance to move to the next step.' },
            { id: 'v9', name: 'Follow-up after delay', intro: 'As some time has passed, I wanted to provide a brief follow-up.', expand: 'I remain fully interested and can adapt quickly to your preferred process cadence.', close: 'Thank you in advance for any status update.' },
            { id: 'v10', name: 'Final formal check-in', intro: 'This is a final professional check-in regarding the current process.', expand: 'Should priorities have shifted, I completely understand and remain grateful for your consideration.', close: 'If possible, I would still value a short update.' },
            { 
  id: 'v11',
  name: 'Straight & direct',
  intro: 'Just wanted to briefly follow up on the process.',
  expand: 'I’m still very interested and happy to move forward whenever timing makes sense on your side.',
  close: 'Appreciate any update you can share.'
},
{
  id: 'v12',
  name: 'Low-pressure',
  intro: 'No rush at all, I just wanted to check in.',
  expand: 'I understand priorities shift, but I remain interested and available if the role is still active.',
  close: 'Thanks again for your time.'
},
{
  id: 'v13',
  name: 'Momentum builder',
  intro: 'Following up to keep momentum around this opportunity.',
  expand: 'The conversations so far strengthened my interest, and I’d like to continue building on that.',
  close: 'Looking forward to hearing your thoughts.'
},
{
  id: 'v14',
  name: 'Practical & grounded',
  intro: 'I wanted to reconnect regarding the current status of the role.',
  expand: 'From what we discussed, I believe I can contribute in practical and measurable ways.',
  close: 'Happy to align on next steps.'
},
{
  id: 'v15',
  name: 'Senior calm tone',
  intro: 'Reaching out with a brief follow-up.',
  expand: 'I understand hiring cycles can take time. I remain interested and available for further discussion.',
  close: 'Please let me know how you’d like to proceed.'
},
{
  id: 'v16',
  name: 'Post-silence recovery',
  intro: 'I haven’t heard back in a little while, so I wanted to reconnect.',
  expand: 'If there have been changes in direction, I completely understand, I would just appreciate clarity.',
  close: 'Thanks in advance for the update.'
},
{
  id: 'v17',
  name: 'Ownership mindset',
  intro: 'I’m following up proactively regarding the process.',
  expand: 'I take ownership seriously and would value the opportunity to demonstrate that further.',
  close: 'Let me know if there’s anything you’d like me to expand on.'
},
{
  id: 'v18',
  name: 'Warm & human',
  intro: 'Hope things are going well on your end.',
  expand: 'I’ve been reflecting on our discussion and remain genuinely interested in contributing.',
  close: 'Would love to hear where things stand.'
},
{
  id: 'v19',
  name: 'Light-touch reminder',
  intro: 'Just a quick note to stay aligned.',
  expand: 'I’m still excited about the role and confident in the fit.',
  close: 'Whenever convenient, I’d appreciate an update.'
},
{
  id: 'v20',
  name: 'Confident closer',
  intro: 'I wanted to close the loop from my side.',
  expand: 'If there’s interest in continuing, I’m ready to move forward.',
  close: 'If not, I still appreciate the time invested so far.'
}

        ];

        const definitions = [
            { id: 'gentle-checkin', name: 'Gentle Check-In', subject: 'Following up on {{role}} at {{company}}', core: 'I wanted to check in regarding the {{role}} process at {{company}}.' },
            { id: 'value-reminder', name: 'Value Reminder', subject: 'Quick follow-up - {{role}} process', core: 'I remain excited about the role and the match with my background in {{techStack}}.' },
            { id: 'final-polite', name: 'Final Polite Follow-Up', subject: 'Last follow-up - {{role}} at {{company}}', core: 'I am sending a final polite follow-up regarding the open process.' },
            { id: 'post-interview-thanks', name: 'Post-Interview Thanks', subject: 'Thank you for the interview - {{role}}', core: 'Thank you for the interview discussion and insights about the role and team.' },
            { id: 'after-home-assignment', name: 'After Home Assignment', subject: 'Follow-up on submitted assignment - {{role}}', core: 'I wanted to follow up after submitting the assignment and share continued interest.' },
            { id: 'after-panel-interview', name: 'After Panel Interview', subject: 'Thank you to the panel - {{role}} at {{company}}', core: 'I appreciated meeting the panel and learning more about expectations and impact.' },
            { id: 'recruiter-checkin', name: 'Recruiter Check-In', subject: 'Recruiter follow-up - {{role}} process', core: 'Wanted to check in on timeline and status for the current process.' },
            { id: 'hiring-manager-followup', name: 'Hiring Manager Follow-Up', subject: 'Following up with hiring manager - {{role}}', core: 'I enjoyed discussing team goals and wanted to reiterate my interest in contributing.' },
            { id: 'salary-alignment', name: 'Salary Alignment Follow-Up', subject: 'Compensation alignment follow-up - {{role}}', core: 'I wanted to continue the discussion around role scope and compensation alignment.' },
            { id: 'offer-decision-delay', name: 'Offer Decision Delay', subject: 'Decision timeline update - {{role}} offer', core: 'I am grateful for the offer and wanted to update you on decision timing.' },
            { id: 'rejection-reconsideration', name: 'Reconsideration Request', subject: 'Thank you and reconsideration request - {{role}}', core: 'Thank you for the update and I wanted to respectfully ask for reconsideration.' },
            { id: 'network-referral-touch', name: 'Network Referral Touchpoint', subject: 'Referral follow-up - {{role}} at {{company}}', core: 'I wanted to follow up regarding the referral and check whether further details would help.' },
            { id: 'keep-in-touch', name: 'Keep-In-Touch for Future Roles', subject: 'Stay in touch - future roles at {{company}}', core: 'Even if timing is not ideal now, I would value staying connected for future opportunities.' },

            { id: 'onsite-followup', name: 'After Onsite Interview', subject: 'Follow-up after onsite interview - {{role}}', core: 'Thank you for the onsite discussions and for sharing additional context around responsibilities.' },
            { id: 'cross-team-round', name: 'After Cross-Team Round', subject: 'Follow-up after cross-team round - {{role}}', core: 'I appreciated speaking with multiple stakeholders and learning how this role collaborates across functions.' },
            { id: 'technical-debrief', name: 'Technical Debrief Follow-Up', subject: 'Technical round follow-up - {{role}}', core: 'I valued the technical conversation and wanted to follow up regarding feedback and next steps.' },
            { id: 'culture-round-followup', name: 'Culture Interview Follow-Up', subject: 'Culture round follow-up - {{role}}', core: 'I appreciated the conversation on culture and values and remain enthusiastic about the opportunity.' },
            { id: 'portfolio-followup', name: 'Portfolio Review Follow-Up', subject: 'Portfolio review follow-up - {{role}}', core: 'Thank you for reviewing my portfolio and discussing how my prior projects could support your goals.' },
            { id: 'manager-second-touch', name: 'Second Touch with Hiring Manager', subject: 'Second follow-up with hiring manager - {{role}}', core: 'I wanted to respectfully follow up after our previous discussion and reiterate my interest in the position.' },
            { id: 'timeline-clarification', name: 'Timeline Clarification Request', subject: 'Clarification on process timeline - {{role}}', core: 'I would appreciate clarification regarding the expected timeline for the remaining recruitment stages.' },
            { id: 'process-paused-followup', name: 'Process Paused Check-In', subject: 'Checking in on paused process - {{role}}', core: 'I understand the process may have paused and wanted to check whether hiring plans have resumed.' },
            { id: 'offer-questions-followup', name: 'Offer Questions Follow-Up', subject: 'Follow-up regarding offer details - {{role}}', core: 'Thank you for sharing the offer details; I wanted to follow up on a few points before finalizing my decision.' },
            { id: 'future-openings-interest', name: 'Interest in Similar Openings', subject: 'Interest in similar opportunities at {{company}}', core: 'If this specific role is no longer active, I would appreciate consideration for similar roles aligned with my profile.' },
            {
  id: 'after-no-show',
  name: 'After Rescheduled / Missed Interview',
  subject: 'Reconnecting regarding {{role}} interview',
  core: 'I wanted to reconnect following the recent scheduling change and confirm next steps.'
},
{
  id: 'after-positive-feedback',
  name: 'After Positive Feedback',
  subject: 'Appreciate the feedback - {{role}}',
  core: 'Thank you for the positive feedback. I’m eager to continue the process.'
},
{
  id: 'after-negative-but-open',
  name: 'After Mixed Feedback',
  subject: 'Following up on feedback - {{role}}',
  core: 'I appreciate the honest feedback and would be glad to address any areas that need clarification.'
},
{
  id: 'availability-update',
  name: 'Availability Update',
  subject: 'Availability update - {{role}} process',
  core: 'I wanted to share a quick update regarding my availability for upcoming discussions.'
},
{
  id: 'competing-offer',
  name: 'Competing Offer Transparency',
  subject: 'Update on timeline - {{role}}',
  core: 'I wanted to share transparently that I am in advanced discussions elsewhere, but your role remains a priority.'
},
{
  id: 'internal-referral-followup',
  name: 'Internal Referral Follow-Up',
  subject: 'Referral connection - {{role}}',
  core: 'Following up regarding the internal referral and whether there’s alignment to proceed.'
},
{
  id: 'role-clarification',
  name: 'Clarifying Role Scope',
  subject: 'Clarification on role scope - {{role}}',
  core: 'I wanted to briefly clarify a few points regarding responsibilities discussed.'
},
{
  id: 'feedback-request',
  name: 'Request for Feedback',
  subject: 'Feedback request - {{role}} interview',
  core: 'If possible, I would appreciate any feedback from the recent stage.'
},
{
  id: 'long-silence-closure',
  name: 'Long Silence Closure',
  subject: 'Closing the loop - {{role}}',
  core: 'As I haven’t heard back, I wanted to close the loop respectfully from my side.'
},
{
  id: 'future-reconnect',
  name: 'Future Reconnect After Rejection',
  subject: 'Staying connected - {{company}}',
  core: 'While this role didn’t move forward, I’d genuinely value staying connected for future opportunities.'
},
{
  id: 'early-stage-touch',
  name: 'Early Stage Follow-Up',
  subject: 'Following up on initial conversation - {{role}}',
  core: 'I enjoyed our initial conversation and wanted to confirm whether there is alignment to proceed.'
},
{
  id: 'post-offer-negotiation',
  name: 'Post Negotiation Follow-Up',
  subject: 'Follow-up on updated offer - {{role}}',
  core: 'Thank you for the revised offer details. I wanted to confirm alignment before finalizing.'
},
{
  id: 'decision-confirmation',
  name: 'Decision Confirmation',
  subject: 'Confirming decision - {{role}}',
  core: 'I wanted to confirm my decision regarding the offer and express appreciation for the process.'
},
{
  id: 'timeline-push',
  name: 'Gentle Timeline Push',
  subject: 'Timeline alignment - {{role}}',
  core: 'Given current discussions, I wanted to align expectations around timing.'
}

        ];

        return definitions.map(def => ({
            id: def.id,
            name: def.name,
            variants: tones.map(tone => ({
                id: tone.id,
                name: tone.name,
                subject: `${def.subject}`,
                body: `Dear {{contactFormal}},\n\n${tone.intro}\n\n${def.core}\n\n\I appreciate your time and would welcome any update.\n\n${tone.close}\n\nBest regards,\n{{user.name}}`
            }))
        }));
    }

    private applyTemplate(value: string, replacements: Record<string, string>): string {
        return value.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, token: string) => replacements[token] || '');
    }

    private getCurrentUserName(): string {
        const authUser = this.authService.getUser();
        const fromAuth = authUser?.name || authUser?.username || authUser?.fullName;
        if (fromAuth) return fromAuth;

        const settings: any = this.settingsService.getSettings();
        const fromSettings = settings?.userName || settings?.profileName || settings?.displayName;
        if (fromSettings) return fromSettings;

        return 'Candidate';
    }

    private getPrimaryContactName(): string {
        if (!this.process?.contacts?.length) return '';
        return this.process.contacts[0]?.name || '';
    }

    async copyFollowUpDraft() {
        const content = `Subject: ${this.generatedFollowUpSubject}\n\n${this.generatedFollowUpMessage}`;
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(content);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = content;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            this.toastService.show('Follow-up draft copied', 'success');
        } catch {
            this.toastService.show('Failed to copy follow-up draft', 'error');
        }
    }

    openFollowUpEmailDraft() {
        if (!this.generatedFollowUpSubject && !this.generatedFollowUpMessage) {
            this.generateFollowUpDraft();
        }
        const subject = encodeURIComponent(this.generatedFollowUpSubject || 'Follow-up');
        const body = encodeURIComponent(this.generatedFollowUpMessage || '');
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    }

    async deleteProcess() {
        if (await this.confirmService.confirm('Are you sure you want to delete this whole process? This cannot be undone.', 'Delete Process')) {
            this.processesService.delete(this.process.id).subscribe(() => {
                this.toastService.show('Process deleted', 'success');
                this.router.navigate(['/']);
            });
        }
    }

    async deleteInteraction(id: number) {
        if (await this.confirmService.confirm('Delete this interaction?', 'Delete Interaction')) {
            this.interactionsService.delete(id).subscribe(() => {
                this.toastService.show('Interaction deleted', 'success');
                this.loadProcess();
            });
        }
    }

    async deleteReview(id: number) {
        if (await this.confirmService.confirm('Delete this self-review?', 'Delete Review')) {
            this.reviewsService.delete(id).subscribe(() => {
                this.toastService.show('Review deleted', 'success');
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

    async deleteContact(id: number) {
        if (await this.confirmService.confirm('Delete this contact?', 'Delete Contact')) {
            this.contactsService.delete(id).subscribe(() => {
                this.toastService.show('Contact deleted', 'success');
                this.loadProcess();
            });
        }
    }

    getStatusClass(stage: string): string {
        if (!stage) return '';
        return 'status-' + stage.toLowerCase().replace(' ', '-');
    }
}
