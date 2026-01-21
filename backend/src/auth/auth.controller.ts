import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body('password') password: string) {
    const isValid = await this.authService.validatePassword(password);
    if (isValid) {
      return { success: true };
    }
    throw new UnauthorizedException('Invalid password');
  }
}
