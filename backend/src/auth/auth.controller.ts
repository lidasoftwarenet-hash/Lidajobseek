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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';

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
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto) {
    try {
      const valid = await this.authService.validateUser(body.email, body.password);
      if (!valid) {
        throw new UnauthorizedException({
          type: 'invalid_credentials',
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.',
        });
      }
      return this.authService.login(valid);
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
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Public()
  @Post('verify-code')
  async verifyCode(@Body() body: VerifyCodeDto) {
    return this.authService.verifyInvitationCode(body.code);
  }

  @Public()
  @Get('activate')
  async activateAccount(@Query('token') token: string) {
    return this.authService.activateAccount(token);
  }
}
