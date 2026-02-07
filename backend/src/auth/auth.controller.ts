import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Get,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    const valid = await this.authService.validateUser(body.email, body.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(valid);
  }

  @Public()
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Public()
  @Post('verify-code')
  async verifyCode(@Body('code') code: string) {
    return this.authService.verifyInvitationCode(code);
  }

  @Public()
  @Get('activate')
  async activateAccount(@Query('token') token: string) {
    return this.authService.activateAccount(token);
  }
}
