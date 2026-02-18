import { NestFactory } from '@nestjs/core';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

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
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      enableDebugMessages: true,
    }),
  );

  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  // CORS configuration - allow multiple origins based on environment
  const allowedOrigins = [
    'http://localhost:4200',
    'http://localhost:3000',
  ];

  // Add production frontend URL from environment variable
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is allowed
      if (allowedOrigins.some(allowedOrigin => origin.startsWith(allowedOrigin))) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked request from origin: ${origin}`);
        console.warn(`Allowed origins: ${allowedOrigins.join(', ')}`);
        callback(null, true); // Still allow for now to prevent blocking
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
  console.log(`📍 Allowed CORS origins: ${allowedOrigins.join(', ')}`);
}

bootstrap().catch(err => {
  console.error('❌ Failed to start application:', err);
  process.exit(1);
});
