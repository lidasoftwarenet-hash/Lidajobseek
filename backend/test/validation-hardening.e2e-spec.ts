import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';

describe('Validation hardening (e2e)', () => {
  let app: INestApplication<App>;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeAll(async () => {
    process.env.NODE_ENV = 'production';

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
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        enableDebugMessages: process.env.NODE_ENV !== 'production',
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('POST /auth/login with unexpected field returns 400', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'Password123!',
        unexpectedField: 'should-be-rejected',
      })
      .expect(400);

    expect(response.body.message).toEqual(
      expect.arrayContaining(['property unexpectedField should not exist']),
    );
  });

  it('POST /auth/login with valid payload still returns 200', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'user@example.com',
        password: 'Password123!',
      })
      .expect(200);
  });

  it('production validation response does not expose debug details', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'not-an-email',
        password: 12345,
      })
      .expect(400);

    const payloadText = JSON.stringify(response.body).toLowerCase();
    expect(payloadText).not.toContain('target');
    expect(payloadText).not.toContain('value');
    expect(payloadText).not.toContain('validationerror');
    expect(payloadText).not.toContain('stack');
  });
});
