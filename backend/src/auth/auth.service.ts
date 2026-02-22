import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UsersSettingsService } from '../users/users-settings.service';
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
    private usersSettingsService: UsersSettingsService,
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

      // Get user settings from user_settings table
      const settings = await this.usersSettingsService.getOrCreateSettings(user.id);

      // Convert MikroORM entity to plain object
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        pricingPlan: user.pricingPlan || 'free',
        themePreference: settings.themePreference || 'light',
        fontSizePreference: settings.fontSizePreference || 14,
        countryPreference: settings.countryPreference || '',
        dateFormatPreference: settings.dateFormatPreference || 'DD/MM/YYYY',
        timeFormatPreference: settings.timeFormatPreference || '24',
        salaryCurrencyPreference: settings.salaryCurrencyPreference || 'USD',
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
        timeFormatPreference: user.timeFormatPreference || '24',
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
    
    // Create user first
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
      timeFormatPreference: '24',
      salaryCurrencyPreference: 'USD',
      isActive: false,
      activationToken,
      activationTokenExpiresAt,
    });

    // Create user settings in user_settings table
    await this.usersSettingsService.getOrCreateSettings(user.id);

    // Create default process stages in user_process_stages table
    await this.usersSettingsService.getOrCreateProcessStages(user.id);

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
    // Get preferences from user_settings table
    return this.usersSettingsService.getPreferences(userId);
  }

  async updatePreferences(userId: number, dto: UpdatePreferencesDto) {
    // Update settings in user_settings table
    const updateData: any = {};
    
    if (dto.theme) {
      updateData.themePreference = dto.theme;
    }

    if (typeof dto.fontSize === 'number') {
      updateData.fontSizePreference = dto.fontSize;
    }

    if (typeof dto.country === 'string') {
      updateData.countryPreference = dto.country;
    }

    if (dto.dateFormat) {
      updateData.dateFormatPreference = dto.dateFormat;
    }

    if (dto.timeFormat) {
      updateData.timeFormatPreference = dto.timeFormat;
    }

    if (dto.salaryCurrency) {
      updateData.salaryCurrencyPreference = dto.salaryCurrency;
    }

    const settings = await this.usersSettingsService.updateSettings(userId, updateData);

    return {
      theme: settings.themePreference || 'light',
      fontSize: settings.fontSizePreference || 14,
      country: settings.countryPreference || '',
      dateFormat: settings.dateFormatPreference || 'DD/MM/YYYY',
      timeFormat: settings.timeFormatPreference || '24',
      salaryCurrency: settings.salaryCurrencyPreference || 'USD',
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
