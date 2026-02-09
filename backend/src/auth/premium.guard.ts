import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../users/users.service';

@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
      throw new ForbiddenException({
        type: 'invalid_session',
        code: 'INVALID_SESSION',
        message: 'User session is missing. Please log in again.',
      });
    }

    const userId = user.userId || user.id;
    if (!userId) {
      throw new ForbiddenException({
        type: 'invalid_session',
        code: 'INVALID_SESSION',
        message: 'User session is invalid. Please log in again.',
      });
    }

    const persistedUser = await this.usersService.findById(Number(userId));
    const pricingPlan = persistedUser?.pricingPlan || user.pricingPlan || 'free';
    request.user.pricingPlan = pricingPlan;

    const isPremium =
      pricingPlan === 'premium' || pricingPlan === 'enterprise';

    if (!isPremium) {
      throw new ForbiddenException({
        type: 'unauthorized_scope',
        code: 'UNAUTHORIZED_SCOPE',
        message: 'This feature requires a premium account. Please upgrade your plan.',
      });
    }

    return true;
  }
}