import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class UpdateReviewDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  stage?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  confidence?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  whatWentWell?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  whatFailed?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  gaps?: string;
}