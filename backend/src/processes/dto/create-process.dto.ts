export class CreateProcessDto {
  companyName: string;
  roleTitle: string;
  techStack: string;
  location: string;
  workMode: string;
  daysFromOffice?: number; // For hybrid work mode
  source?: string;
  salaryExpectation?: number;
  currentStage: string;
  dataFromThePhoneCall?: string;
  nextFollowUp?: string;

  // Initial Invitation Details
  initialInviteDate?: string;
  initialInviteMethod?: string;
  initialInviteContent?: string;

  // Career Intelligence
  scoreTech?: number;
  scoreWLB?: number;
  scoreGrowth?: number;
  scoreVibe?: number;
  tailoredPitch?: string;
  cvVersion?: string;
  submissionLink?: string;
}
