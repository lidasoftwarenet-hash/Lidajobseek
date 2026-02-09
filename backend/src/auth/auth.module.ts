import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    UsersModule,
    MailModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: (() => {
          const jwtSecret = configService.get<string>('JWT_SECRET');
          if (!jwtSecret?.trim()) {
            throw new Error('JWT_SECRET is required and must be set in environment variables');
          }
          return jwtSecret.trim();
        })(),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, {
    provide: APP_GUARD,
    useClass: AuthGuard,
  }],
  exports: [AuthService]
})
export class AuthModule { }
