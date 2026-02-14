import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProcessDto {
  @IsString()
  @MinLength(1)
  companyName: string;

  @IsString()
  @MinLength(1)
  roleTitle: string;

  @IsString()
  @MinLength(1)
  techStack: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsString()
  @MinLength(1)
  workMode: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  daysFromOffice?: number;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsNumber()
  salaryExpectation?: number;

  @IsOptional()
  @IsString()
  salaryCurrency?: string;

  @IsOptional()
  @IsString()
  salaryPeriod?: string;

  @IsString()
  @MinLength(1)
  currentStage: string;

  @IsOptional()
  @IsString()
  dataFromThePhoneCall?: string;

  @IsOptional()
  @IsString()
  nextFollowUp?: string;

  @IsOptional()
  @IsString()
  initialInviteDate?: string;

  @IsOptional()
  @IsString()
  initialInviteMethod?: string;

  @IsOptional()
  @IsString()
  initialInviteContent?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  scoreTech?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  scoreWLB?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  scoreGrowth?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  scoreVibe?: number;

  @IsOptional()
  @IsString()
  tailoredPitch?: string;

  @IsOptional()
  @IsString()
  cvVersion?: string;

  @IsOptional()
  @IsString()
  submissionLink?: string;
}
