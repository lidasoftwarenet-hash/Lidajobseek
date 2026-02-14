import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateProcessDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  roleTitle?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  techStack?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  workMode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  daysFromOffice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salaryExpectation?: number;

  @IsOptional()
  @IsString()
  salaryCurrency?: string;

  @IsOptional()
  @IsString()
  salaryPeriod?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  baseSalary?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  signingBonus?: number;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  currentStage?: string;

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
  @IsString()
  offerDeadline?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  scoreTech?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  scoreWLB?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  scoreGrowth?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  scoreVibe?: number;
}