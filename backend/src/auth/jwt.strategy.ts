import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        if (!jwtSecret?.trim()) {
            throw new Error('JWT_SECRET is required and must be set in environment variables');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtSecret.trim(),
        });
    }

  async validate(payload: any) {
    return { 
      id: payload.sub,
      userId: payload.sub,
      email: payload.email,
      pricingPlan: payload.pricingPlan || 'free'
    };
  }
}
