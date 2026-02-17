import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import helmet from 'helmet';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

describe('Helmet headers (e2e)', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  const buildApp = async (nodeEnv: string): Promise<INestApplication<App>> => {
    process.env.NODE_ENV = nodeEnv;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    const app = moduleFixture.createNestApplication();
    app.use(
      helmet({
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

    await app.init();
    return app;
  };

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('sets X-Content-Type-Options and X-Frame-Options in non-production without HSTS', async () => {
    const app = await buildApp('test');

    try {
      const response = await request(app.getHttpServer()).get('/health').expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['strict-transport-security']).toBeUndefined();
    } finally {
      await app.close();
    }
  });

  it('sets Strict-Transport-Security in production mode', async () => {
    const app = await buildApp('production');

    try {
      const response = await request(app.getHttpServer()).get('/health').expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
    } finally {
      await app.close();
    }
  });
});
