export class CreateInteractionDto {
    processId: number;
    date: string;
    interviewType: string;
    participants?: any;
    summary: string;
    testsAssessment?: string; // Tests or technical assessments during interview
    roleInsights?: string; // What was learned about the role
    notes?: string;
    headsup?: string; // Heads-up information for scheduled interview
    nextInviteStatus?: string;
    nextInviteDate?: string;
    nextInviteLink?: string;
    nextInviteType?: string;
    invitationExtended?: string; // 'yes', 'later', or 'no'
}
