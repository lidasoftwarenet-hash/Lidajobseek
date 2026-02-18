import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

const DEV_LOCALHOST_ORIGINS = ['http://localhost:4200', 'http://127.0.0.1:4200'];

const parseOrigins = (value?: string): string[] => {
  if (!value) return [];

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0 && origin !== '*');
};

export const buildCorsOptions = (
  nodeEnv: string | undefined,
  corsOriginsEnv: string | undefined,
  corsCredentialsEnv: string | undefined,
): CorsOptions => {
  const isProduction = nodeEnv === 'production';
  const configuredOrigins = parseOrigins(corsOriginsEnv);
  const credentials = String(corsCredentialsEnv).toLowerCase() === 'true';

  return {
    credentials,
    origin: (origin, callback) => {
      // allow non-browser clients (no Origin header)
      if (!origin) {
        return callback(null, true);
      }

      // if explicit origins configured, enforce allowlist
      if (configuredOrigins.length > 0) {
        if (configuredOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'), false);
      }

      // no configured origins:
      // in same-origin deployment we allow all
      return callback(null, true);
    },
  };
};

