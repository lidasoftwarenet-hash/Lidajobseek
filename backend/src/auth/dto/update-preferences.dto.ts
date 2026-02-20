import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsIn(['light', 'dark', 'auto'])
  theme?: 'light' | 'dark' | 'auto';

  @IsOptional()
  @IsInt()
  @Min(12)
  @Max(18)
  fontSize?: number;
}
