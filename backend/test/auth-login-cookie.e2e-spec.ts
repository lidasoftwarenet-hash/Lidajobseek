import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';

describe('Auth login cookie issuance (e2e)', () => {
  let app: INestApplication<App>;
  const originalNodeEnv = process.env.NODE_ENV;

  const buildApp = async (nodeEnv: 'test' | 'production') => {
    process.env.NODE_ENV = nodeEnv;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'default',
            ttl: 60_000,
            limit: 1000,
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
              isActive: true,
              name: 'User',
            })),
            login: jest.fn(() => ({
              access_token: 'jwt-token',
              user: { id: 1, email: 'user@example.com' },
            })),
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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  };

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('sets HttpOnly + SameSite cookie in development mode (secure=false)', async () => {
    await buildApp('test');

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'Password123!' })
      .expect(200);

    const setCookieHeader = response.headers['set-cookie']?.[0] ?? '';
    expect(setCookieHeader).toContain('access_token=jwt-token');
    expect(setCookieHeader).toContain('HttpOnly');
    expect(setCookieHeader).toContain('SameSite=Lax');
    expect(setCookieHeader).not.toContain('Secure');
  });

  it('sets HttpOnly + SameSite cookie in production mode (secure=true)', async () => {
    await buildApp('production');

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'Password123!' })
      .expect(200);

    const setCookieHeader = response.headers['set-cookie']?.[0] ?? '';
    expect(setCookieHeader).toContain('access_token=jwt-token');
    expect(setCookieHeader).toContain('HttpOnly');
    expect(setCookieHeader).toContain('SameSite=Lax');
    expect(setCookieHeader).toContain('Secure');
  });
});
