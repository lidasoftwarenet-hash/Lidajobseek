import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body('password') password: string) {
    if (this.authService.validatePassword(password)) {
      return { success: true };
    }
    throw new UnauthorizedException('Invalid password');
  }
}
