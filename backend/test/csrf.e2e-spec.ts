import { Body, Controller, HttpCode, HttpStatus, INestApplication, Post, Req } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { csrfMiddleware } from '../src/security/csrf.middleware';

@Controller('protected')
class ProtectedTestController {
  @Post('echo')
  @HttpCode(HttpStatus.OK)
  echo(@Body() body: Record<string, unknown>, @Req() req: any) {
    return { ok: true, body, userId: req.user?.userId ?? null };
  }
}

describe('CSRF double-submit protection (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
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
      controllers: [AuthController, ProtectedTestController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            getSocialAuthStartConfig: jest.fn(() => ({ success: false })),
            completeSocialAuth: jest.fn(() => ({ success: false })),
            validateUser: jest.fn(async () => null),
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
    app.use(cookieParser());
    app.use(csrfMiddleware);
    app.use((req: any, _res: any, next: () => void) => {
      req.user = { userId: 1 };
      next();
    });
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/auth/csrf sets csrf_token cookie', async () => {
    const response = await request(app.getHttpServer()).get('/api/auth/csrf').expect(200);

    const cookieHeader = response.headers['set-cookie']?.find((cookie: string) =>
      cookie.startsWith('csrf_token='),
    );

    expect(cookieHeader).toBeDefined();
    expect(cookieHeader).toContain('SameSite=Lax');
    expect(response.body?.csrfToken).toBeTruthy();
  });

  it('POST protected endpoint without X-CSRF-Token header returns 403', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.get('/api/auth/csrf').expect(200);

    await agent.post('/api/protected/echo').send({ hello: 'world' }).expect(403);
  });

  it('POST protected endpoint with matching X-CSRF-Token header returns 200', async () => {
    const agent = request.agent(app.getHttpServer());
    const csrfResponse = await agent.get('/api/auth/csrf').expect(200);
    const csrfToken = csrfResponse.body?.csrfToken;

    const response = await agent
      .post('/api/protected/echo')
      .set('x-csrf-token', csrfToken)
      .send({ hello: 'world' })
      .expect(200);

    expect(response.body?.ok).toBe(true);
  });
});
