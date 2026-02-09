import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
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
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: 'http://localhost:4200',
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
