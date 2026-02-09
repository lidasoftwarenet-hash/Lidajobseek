import { IsBase64, IsEmail, IsOptional, IsString } from 'class-validator';

export class SendCvEmailDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @IsBase64()
  pdfBase64?: string;
}
