import { IsBase64, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

const CV_UPLOAD_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_PDF_BASE64_CHARS = Math.ceil((CV_UPLOAD_MAX_SIZE_BYTES * 4) / 3) + 2000;

export class SendCvEmailDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @IsBase64()
  @MaxLength(MAX_PDF_BASE64_CHARS)
  pdfBase64?: string;
}
