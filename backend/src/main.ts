import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';
import { buildCorsOptions } from './security/cors.config';
import cookieParser from 'cookie-parser';

const envPath = (() => {
  const backendEnv = join(process.cwd(), 'backend', '.env');
  const rootEnv = join(process.cwd(), '.env');
  const parentBackendEnv = join(process.cwd(), '..', 'backend', '.env');

  if (existsSync(backendEnv)) {
    return backendEnv;
  }
  if (existsSync(parentBackendEnv)) {
    return parentBackendEnv;
  }
  return rootEnv;
})();

loadEnv({ path: envPath });

async function bootstrap() {
  if (!process.env.JWT_SECRET?.trim()) {
    throw new Error('JWT_SECRET is required and must be set before starting the backend');
  }

  const { AppModule } = await import('./app.module.js');
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  const expressApp = app.getHttpAdapter().getInstance();

  app.use(
    helmet({
      contentSecurityPolicy: false,
      hsts: process.env.NODE_ENV === 'production'
        ? {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        }
        : false,
      crossOriginResourcePolicy: false,
    }),
  );

  const trustProxy = process.env.TRUST_PROXY?.trim();
  if (trustProxy) {
    const normalized = trustProxy.toLowerCase();
    if (normalized === 'true') {
      expressApp.set('trust proxy', 1);
    } else if (normalized === 'false') {
      expressApp.set('trust proxy', false);
    } else if (!Number.isNaN(Number(normalized))) {
      expressApp.set('trust proxy', Number(normalized));
    } else {
      expressApp.set('trust proxy', trustProxy);
    }
  } else if (process.env.NODE_ENV === 'production') {
    // Required behind Render/NGINX so req.ip is derived from x-forwarded-for.
    expressApp.set('trust proxy', 1);
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      enableDebugMessages: process.env.NODE_ENV !== 'production',
    }),
  );
  app.setGlobalPrefix('api');
  app.enableCors(
    buildCorsOptions(
      process.env.NODE_ENV,
      process.env.CORS_ORIGINS,
      process.env.CORS_CREDENTIALS,
    ),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
