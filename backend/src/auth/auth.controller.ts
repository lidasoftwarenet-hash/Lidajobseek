import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  InternalServerErrorException,
  Get,
  Query,
  Param,
  Logger,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';

const DEFAULT_ACCESS_TOKEN_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

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
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    try {
      const valid = await this.authService.validateUser(body.email, body.password);
      if (!valid) {
        throw new UnauthorizedException({
          type: 'invalid_credentials',
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        });
      }

      const loginResult = await this.authService.login(valid);
      const maxAge = Number(process.env.ACCESS_TOKEN_COOKIE_MAX_AGE_MS);

      res.cookie('access_token', loginResult.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge:
          Number.isFinite(maxAge) && maxAge > 0
            ? maxAge
            : DEFAULT_ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
      });

      return loginResult;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error('Unexpected login error', error instanceof Error ? error.stack : undefined);
      throw new InternalServerErrorException({
        type: 'server_error',
        code: 'SERVER_ERROR',
        message: 'Login failed due to a server error. Please try again.',
      });
    }
  }

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 10 * 60_000 } })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Public()
  @Post('verify-code')
  @Throttle({ default: { limit: 5, ttl: 10 * 60_000 } })
  async verifyCode(@Body() body: VerifyCodeDto) {
    return this.authService.verifyInvitationCode(body.code);
  }

  @Public()
  @Get('activate')
  @Throttle({ default: { limit: 10, ttl: 10 * 60_000 } })
  async activateAccount(@Query('token') token: string) {
    return this.authService.activateAccount(token);
  }
}
