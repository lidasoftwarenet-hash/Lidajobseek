import { IsString, MinLength } from 'class-validator';

export class VerifyCodeDto {
  @IsString()
  @MinLength(1)
  code!: string;
}