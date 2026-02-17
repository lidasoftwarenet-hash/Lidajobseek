import { ForbiddenException } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSRF_EXCLUDED_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/activate',
  '/api/auth/csrf',
  '/health',
]);

export function csrfMiddleware(req: Request, _res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  if (!MUTATING_METHODS.has(method)) {
    return next();
  }

  const requestPath = req.path;
  if (CSRF_EXCLUDED_PATHS.has(requestPath)) {
    return next();
  }

  const cookieToken = req.cookies?.csrf_token;
  const headerToken = req.headers['x-csrf-token'];
  const normalizedHeaderToken = Array.isArray(headerToken) ? headerToken[0] : headerToken;

  if (!cookieToken || !normalizedHeaderToken || cookieToken !== normalizedHeaderToken) {
    throw new ForbiddenException('Invalid CSRF token');
  }

  return next();
}
