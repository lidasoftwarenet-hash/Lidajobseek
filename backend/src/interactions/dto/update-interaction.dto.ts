import { IsArray, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateInteractionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  date?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  interviewType?: string;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  participants?: any;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  testsAssessment?: string;

  @IsOptional()
  @IsString()
  roleInsights?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  headsup?: string;

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
  invitationExtended?: string;
}