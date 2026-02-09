import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class AuthGuard extends PassportAuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      const rawMessage = String(info?.message || err?.message || '').toLowerCase();
      const tokenExpired = rawMessage.includes('jwt expired') || info?.name === 'TokenExpiredError';
      const malformedToken =
        rawMessage.includes('jwt malformed') ||
        rawMessage.includes('invalid signature') ||
        rawMessage.includes('invalid token') ||
        info?.name === 'JsonWebTokenError';

      if (tokenExpired) {
        throw new UnauthorizedException({
          type: 'expired_token',
          code: 'TOKEN_EXPIRED',
          message: 'Your session has expired. Please log in again.',
        });
      }

      if (malformedToken) {
        throw new UnauthorizedException({
          type: 'invalid_token',
          code: 'INVALID_TOKEN',
          message: 'Your session token is invalid. Please log in again.',
        });
      }

      throw new UnauthorizedException({
        type: 'invalid_session',
        code: 'INVALID_SESSION',
        message: 'Authentication is required to access this resource.',
      });
    }
    return user;
  }
}
