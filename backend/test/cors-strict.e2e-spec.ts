import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { buildCorsOptions } from '../src/security/cors.config';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

describe('Strict CORS configuration (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors(
      buildCorsOptions('production', 'https://allowed.example.com', 'false'),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Allowed origin passes preflight', async () => {
    await request(app.getHttpServer())
      .options('/health')
      .set('Origin', 'https://allowed.example.com')
      .set('Access-Control-Request-Method', 'GET')
      .expect(204)
      .expect('access-control-allow-origin', 'https://allowed.example.com');
  });

  it('Disallowed origin is rejected', async () => {
    await request(app.getHttpServer())
      .options('/health')
      .set('Origin', 'https://evil.example.com')
      .set('Access-Control-Request-Method', 'GET')
      .expect(500);
  });
});
