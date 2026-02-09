import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  linkedIn?: string;

  @IsOptional()
  @IsString()
  socialHooks?: string;

  @IsOptional()
  @IsString()
  email?: string;
}