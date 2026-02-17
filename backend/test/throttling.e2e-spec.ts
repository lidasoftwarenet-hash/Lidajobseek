import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';

describe('Rate limiting (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: 60_000,
            limit: 500,
          },
        ]),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            getSocialAuthStartConfig: jest.fn(() => ({ success: false })),
            completeSocialAuth: jest.fn(() => ({ success: false })),
            validateUser: jest.fn(async () => ({
              id: 1,
              email: 'user@example.com',
              pricingPlan: 'free',
            })),
            login: jest.fn(() => ({ access_token: 'token', user: { id: 1 } })),
            register: jest.fn(async () => ({ success: true })),
            verifyInvitationCode: jest.fn(async () => ({ success: true })),
            activateAccount: jest.fn(async () => ({ success: true })),
          },
        },
        {
          provide: APP_GUARD,
          useClass: ThrottlerGuard,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');

    // Simulates Render/NGINX setup so req.ip honors x-forwarded-for.
    app.getHttpAdapter().getInstance().set('trust proxy', 1);

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('throttles /auth/login after 5 requests per minute', async () => {
    const body = { email: 'user@example.com', password: 'Password123!' };

    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('x-forwarded-for', '1.1.1.1')
        .send(body)
        .expect(200);
    }

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('x-forwarded-for', '1.1.1.1')
      .send(body)
      .expect(429);
  });

  it('throttles /auth/register after 3 requests per window', async () => {
    const body = {
      email: 'register@example.com',
      username: 'tester',
      password: 'Password123!',
    };

    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .set('x-forwarded-for', '5.5.5.5')
        .send(body)
        .expect(201);
    }

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .set('x-forwarded-for', '5.5.5.5')
      .send(body)
      .expect(429);
  });

  it('uses client IP from x-forwarded-for when trust proxy is enabled', async () => {
    const body = { email: 'proxy@example.com', password: 'Password123!' };

    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('x-forwarded-for', '10.10.10.1')
        .send(body)
        .expect(200);
    }

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('x-forwarded-for', '10.10.10.1')
      .send(body)
      .expect(429);

    // Different client IP should have a separate quota bucket.
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('x-forwarded-for', '10.10.10.2')
      .send(body)
      .expect(200);
  });
});
