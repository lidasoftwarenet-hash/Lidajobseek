import {
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateInteractionDto {
  @IsInt()
  processId: number;

  @IsString()
  @MinLength(1)
  date: string;

  @IsString()
  @MinLength(1)
  interviewType: string;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  participants?: any;

  @IsString()
  @MinLength(1)
  summary: string;

  @IsOptional()
  @IsString()
  testsAssessment?: string; // Tests or technical assessments during interview

  @IsOptional()
  @IsString()
  roleInsights?: string; // What was learned about the role

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  headsup?: string; // Heads-up information for scheduled interview

  @IsOptional()
  @IsString()
  nextInviteStatus?: string;

  @IsOptional()
  @IsString()
  nextInviteDate?: string;

  @IsOptional()
  @IsString()
  nextInviteLink?: string;

  @IsOptional()
  @IsString()
  nextInviteType?: string;

  @IsOptional()
  @IsString()
  invitationExtended?: string; // 'yes', 'later', or 'no'

  @IsOptional()
  @IsInt()
  duration?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  meetingLink?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsInt()
  reminder?: number;

  @IsOptional()
  @IsArray()
  preparationChecklist?: any;
}
