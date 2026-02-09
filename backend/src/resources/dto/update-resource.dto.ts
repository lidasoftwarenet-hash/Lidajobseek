import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateResourceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  type?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @IsOptional()
  @IsString()
  tags?: string;
}