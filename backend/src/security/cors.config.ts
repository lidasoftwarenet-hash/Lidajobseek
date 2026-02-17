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
  const allowedOrigins =
    configuredOrigins.length > 0
      ? configuredOrigins
      : isProduction
        ? []
        : DEV_LOCALHOST_ORIGINS;

  const credentials = String(corsCredentialsEnv).toLowerCase() === 'true';

  return {
    credentials,
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'), false);
    },
  };
};
