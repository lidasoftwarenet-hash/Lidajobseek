import { IsEmail } from 'class-validator';

export class ShareProfileDto {
  @IsEmail()
  email: string;
}