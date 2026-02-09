import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateResourceDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  type!: string;

  @IsString()
  @IsOptional()
  content!: string;

  @IsOptional()
  @IsString()
  tags?: string;
}