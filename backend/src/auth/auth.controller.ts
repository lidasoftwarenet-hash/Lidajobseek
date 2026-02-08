import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  ServiceUnavailableException,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Public()
  @Get('oauth/:provider/start')
  getSocialAuthStart(
    @Param('provider') provider: string,
    @Query('state') state: string,
    @Query('redirectUri') redirectUri: string,
    @Query('intent') intent: string,
    @Query('clientId') clientId: string,
  ) {
    return this.authService.getSocialAuthStartConfig(provider, {
      state,
      redirectUri,
      intent,
      clientId,
    });
  }

  @Public()
  @Post('oauth/:provider/callback')
  completeSocialAuth(
    @Param('provider') provider: string,
    @Body() body: { code?: string; state?: string; redirectUri?: string },
  ) {
    return this.authService.completeSocialAuth(provider, body);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: any) {
    try {
      const valid = await this.authService.validateUser(body.email, body.password);
      if (!valid) {
        throw new UnauthorizedException('Invalid credentials');
      }
      return this.authService.login(valid);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new ServiceUnavailableException(
        'We are currently undergoing maintenance. Please try again shortly.',
      );
    }
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
