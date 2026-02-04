import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresPremium = this.reflector.getAllAndOverride<boolean>(
      'requiresPremium',
      [context.getHandler(), context.getClass()],
    );

    if (!requiresPremium) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const isPremium =
      user.pricingPlan === 'premium' || user.pricingPlan === 'enterprise';

    if (!isPremium) {
      throw new ForbiddenException(
        'This feature requires a premium account. Please upgrade your plan.',
      );
    }

    return true;
  }
}