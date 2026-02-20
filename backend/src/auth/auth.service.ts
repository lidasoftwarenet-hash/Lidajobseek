import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { DEFAULT_PROCESS_STAGES } from '../processes/process-stages.constants';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const normalizedEmail = email?.trim().toLowerCase();
    const user = normalizedEmail ? await this.usersService.findOne(normalizedEmail) : null;
    if (user && await bcrypt.compare(pass, user.password)) {
      if (!user.isActive) {
        throw new UnauthorizedException({
          type: 'invalid_credentials',
          code: 'ACCOUNT_NOT_ACTIVE',
          message: 'Your account is not active yet. Please verify your email before logging in.',
        });
      }

      // Convert MikroORM entity to plain object
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        pricingPlan: user.pricingPlan || 'free',
        themePreference: user.themePreference || 'light',
        fontSizePreference: user.fontSizePreference || 14,
        countryPreference: user.countryPreference || '',
        dateFormatPreference: user.dateFormatPreference || 'DD/MM/YYYY',
        salaryCurrencyPreference: user.salaryCurrencyPreference || 'USD',
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    }
    return null;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      pricingPlan: user.pricingPlan || 'free',
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        pricingPlan: user.pricingPlan || 'free',
        themePreference: user.themePreference || 'light',
        fontSizePreference: user.fontSizePreference || 14,
        countryPreference: user.countryPreference || '',
        dateFormatPreference: user.dateFormatPreference || 'DD/MM/YYYY',
        salaryCurrencyPreference: user.salaryCurrencyPreference || 'USD',
        isActive: user.isActive,
      }
    };
  }

  async register(registerDto: RegisterDto) {
    const normalizedEmail = registerDto.email?.trim().toLowerCase();
    const username = registerDto.username?.trim();
    const phone = registerDto.phone?.trim();
    const password = registerDto.password;

    if (!normalizedEmail || !username || !password) {
      throw new BadRequestException('All fields are required.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new BadRequestException('Please provide a valid email address.');
    }

    if (username.length < 2) {
      throw new BadRequestException('User name must be at least 2 characters long.');
    }

    const phoneRegex = /^[0-9+\-()\s]{7,20}$/;
    if (phone && !phoneRegex.test(phone)) {
      throw new BadRequestException('Please provide a valid phone number.');
    }

    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long.');
    }

    const existingUser = await this.usersService.findOne(normalizedEmail);
    if (existingUser) {
      throw new ConflictException('An account with this email already exists.');
    }

    const activationToken = randomBytes(32).toString('hex');
    const activationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({
      email: normalizedEmail,
      password: hashedPassword,
      name: username,
      phone: phone || undefined,
      pricingPlan: 'free',
      processStages: [...DEFAULT_PROCESS_STAGES],
      themePreference: 'light',
      fontSizePreference: 14,
      countryPreference: '',
      dateFormatPreference: 'DD/MM/YYYY',
      salaryCurrencyPreference: 'USD',
      isActive: false,
      activationToken,
      activationTokenExpiresAt,
    });

    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const activationLink = `${frontendBaseUrl}/activate-account?token=${activationToken}`;

    await this.mailService.sendAccountActivationEmail(
      user.email,
      user.name || 'User',
      activationLink,
    );

    return {
      success: true,
      message:
        'Registration successful. Please check your email to activate your account.',
    };
  }

  async activateAccount(token: string) {
    const normalizedToken = token?.trim();
    if (!normalizedToken) {
      throw new BadRequestException('Activation token is required.');
    }

    const user = await this.usersService.findByActivationToken(normalizedToken);
    if (!user) {
      throw new BadRequestException('Invalid activation token.');
    }

    if (user.isActive) {
      return {
        success: true,
        message: 'Your account is already active. You can log in now.',
      };
    }

    if (
      user.activationTokenExpiresAt &&
      user.activationTokenExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException(
        'Activation link has expired. Please register again or contact support.',
      );
    }

    user.isActive = true;
    user.activationToken = null;
    user.activationTokenExpiresAt = null;
    await this.usersService.save(user);

    return {
      success: true,
      message: 'Your account has been activated successfully.',
    };
  }

  async verifyInvitationCode(code: string) {
    const validCode = process.env.REGISTER;
    if (validCode && code !== validCode) {
      throw new UnauthorizedException({
        type: 'invalid_credentials',
        code: 'INVALID_VERIFICATION_CODE',
        message: 'Invalid verification code. Please contact Lida Software.',
      });
    }
    return { success: true };
  }

  async getPreferences(userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      theme: user.themePreference || 'light',
      fontSize: user.fontSizePreference || 14,
      country: user.countryPreference || '',
      dateFormat: user.dateFormatPreference || 'DD/MM/YYYY',
      salaryCurrency: user.salaryCurrencyPreference || 'USD',
    };
  }

  async updatePreferences(userId: number, dto: UpdatePreferencesDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (dto.theme) {
      user.themePreference = dto.theme;
    }

    if (typeof dto.fontSize === 'number') {
      user.fontSizePreference = dto.fontSize;
    }

    if (typeof dto.country === 'string') {
      user.countryPreference = dto.country;
    }

    if (dto.dateFormat) {
      user.dateFormatPreference = dto.dateFormat;
    }

    if (dto.salaryCurrency) {
      user.salaryCurrencyPreference = dto.salaryCurrency;
    }

    await this.usersService.save(user);

    return {
      theme: user.themePreference || 'light',
      fontSize: user.fontSizePreference || 14,
      country: user.countryPreference || '',
      dateFormat: user.dateFormatPreference || 'DD/MM/YYYY',
      salaryCurrency: user.salaryCurrencyPreference || 'USD',
    };
  }

  getSocialAuthStartConfig(provider: string, query: { state?: string; redirectUri?: string; intent?: string; clientId?: string }) {
    return {
      success: false,
      message: `OAuth start for '${provider}' is scaffolded but not enabled yet.`,
      provider,
      received: {
        state: query.state || null,
        redirectUri: query.redirectUri || null,
        intent: query.intent || 'register',
        clientId: query.clientId || null,
      },
      nextStep: 'Implement provider strategy and redirect to provider authorization URL.',
    };
  }

  completeSocialAuth(provider: string, payload: { code?: string; state?: string; redirectUri?: string }) {
    return {
      success: false,
      message: `OAuth callback for '${provider}' is scaffolded but not enabled yet.`,
      provider,
      received: {
        code: payload.code || null,
        state: payload.state || null,
        redirectUri: payload.redirectUri || null,
      },
      nextStep: 'Exchange authorization code with provider, then create/login local user and return JWT.',
    };
  }

  // Deprecated helper to keep old code valid if called, but implementation changed
  async validatePassword(_password: string): Promise<boolean> {
    // Logic moved to validateUser
    return false;
  }
}
