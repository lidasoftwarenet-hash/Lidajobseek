import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

const LOGIN_BODY = { email: 'user@example.com', password: 'Password123!' };

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  let app: INestApplication | null = null;

  try {
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
      controllers: [AuthController, AppController],
      providers: [
        AppService,
        {
          provide: AuthService,
          useValue: {
            getSocialAuthStartConfig: () => ({ success: false }),
            completeSocialAuth: () => ({ success: false }),
            validateUser: async () => ({
              id: 1,
              email: 'user@example.com',
              pricingPlan: 'free',
              isActive: true,
            }),
            login: () => ({ access_token: 'token', user: { id: 1 } }),
            register: async () => ({ success: true }),
            verifyInvitationCode: async () => ({ success: true }),
            activateAccount: async () => ({ success: true }),
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
    app.getHttpAdapter().getInstance().set('trust proxy', 1);

    app.use((req: any, _res: any, next: () => void) => {
      if (req.path === '/api/auth/login') {
        const xff = req.headers['x-forwarded-for'] || '';
        console.log(`[proxy-log] req.ip=${req.ip} x-forwarded-for=${xff}`);
      }
      next();
    });

    await app.listen(0);

    const server = app.getHttpServer();
    const address = server.address();
    const port = typeof address === 'string' ? 0 : address?.port;
    assert(!!port, 'Could not resolve ephemeral server port');
    const baseUrl = `http://127.0.0.1:${port}`;

    console.log('--- 1) supertest abuse simulation (/api/auth/login) ---');
    const supertestStatuses: number[] = [];
    for (let i = 1; i <= 6; i++) {
      const res = await request(server)
        .post('/api/auth/login')
        .set('x-forwarded-for', '101.101.101.1')
        .send(LOGIN_BODY);
      supertestStatuses.push(res.status);
      console.log(`supertest attempt #${i} -> ${res.status}`);
    }
    assert(supertestStatuses.slice(0, 5).every((s) => s === 200), 'Expected first 5 supertest login attempts to return 200');
    assert(supertestStatuses[5] === 429, 'Expected supertest 6th login attempt to return 429');

    console.log('--- 1b) raw HTTP loop abuse simulation (/api/auth/login) ---');
    const rawStatuses: number[] = [];
    for (let i = 1; i <= 6; i++) {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '202.202.202.2',
        },
        body: JSON.stringify(LOGIN_BODY),
      });
      rawStatuses.push(res.status);
      console.log(`raw-http attempt #${i} -> ${res.status}`);
    }
    assert(rawStatuses.slice(0, 5).every((s) => s === 200), 'Expected first 5 raw-http login attempts to return 200');
    assert(rawStatuses[5] === 429, 'Expected raw-http 6th login attempt to return 429');

    console.log('--- 1c) TTL reset validation (/api/auth/login, 60s) ---');
    for (let i = 1; i <= 6; i++) {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '203.203.203.3',
        },
        body: JSON.stringify(LOGIN_BODY),
      });
      console.log(`ttl-check pre-wait attempt #${i} -> ${res.status}`);
    }

    console.log('Waiting 61 seconds to confirm throttler TTL reset...');
    await new Promise((resolve) => setTimeout(resolve, 61_000));

    const postTtl = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.203.203.3',
      },
      body: JSON.stringify(LOGIN_BODY),
    });
    console.log(`ttl-check post-wait attempt -> ${postTtl.status}`);
    assert(postTtl.status === 200, 'Expected login request after TTL expiry to return 200');

    console.log('--- 2) proxy bucket separation validation ---');
    for (let i = 1; i <= 6; i++) {
      const res = await request(server)
        .post('/api/auth/login')
        .set('x-forwarded-for', '10.10.10.10')
        .send(LOGIN_BODY);
      console.log(`proxy-A attempt #${i} -> ${res.status}`);
    }
    const proxyB = await request(server)
      .post('/api/auth/login')
      .set('x-forwarded-for', '10.10.10.11')
      .send(LOGIN_BODY);
    console.log(`proxy-B first attempt -> ${proxyB.status}`);
    assert(proxyB.status === 200, 'Expected separate IP bucket to remain unblocked');

    console.log('--- 4) health-check flow should not be throttled ---');
    for (let i = 1; i <= 150; i++) {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.status !== 200) {
        throw new Error(`Health check throttled unexpectedly at attempt #${i} with status ${res.status}`);
      }
    }
    console.log('health checks: 150/150 returned 200');

    console.log('Manual throttling verification completed successfully.');
  } finally {
    if (app) {
      await app.close();
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
