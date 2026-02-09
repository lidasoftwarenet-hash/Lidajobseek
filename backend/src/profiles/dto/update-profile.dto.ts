import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  degree?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  currentWorkplace?: string;

  @IsOptional()
  @IsString()
  about?: string;

  @IsOptional()
  @IsString()
  topSkills?: string;

  @IsOptional()
  @IsString()
  activity?: string;

  @IsOptional()
  @IsString()
  oldCompanies?: string;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @IsString()
  privateProjects?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsString()
  certifications?: string;

  @IsOptional()
  @IsString()
  links?: string;
}