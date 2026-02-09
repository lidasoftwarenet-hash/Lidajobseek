import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  processId: number;

  @IsString()
  @MinLength(1)
  stage: string;

  @IsInt()
  @Min(1)
  @Max(5)
  confidence: number; // 1–5

  @IsString()
  @MinLength(1)
  whatWentWell: string;

  @IsString()
  @MinLength(1)
  whatFailed: string;

  @IsString()
  @MinLength(1)
  gaps: string;
}
