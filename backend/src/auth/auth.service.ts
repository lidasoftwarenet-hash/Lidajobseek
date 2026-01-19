import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly password: string;

  constructor(private configService: ConfigService) {
    this.password = this.configService.get<string>('APP_PASSWORD') || '1234';
  }

  validatePassword(password: string): boolean {
    return password === this.password;
  }
}
