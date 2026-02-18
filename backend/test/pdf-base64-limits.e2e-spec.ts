import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { json } from 'express';
import { ProfilesController } from '../src/profiles/profiles.controller';
import { ProfilesService } from '../src/profiles/profiles.service';
import { PremiumGuard } from '../src/auth/premium.guard';
import { UsersService } from '../src/users/users.service';

const CV_UPLOAD_MAX_SIZE = 5 * 1024 * 1024;

describe('PDF base64 limits (e2e)', () => {
  let app: INestApplication<App>;

  const profilesServiceMock = {
    getProfileWithLastCv: jest.fn(),
    updateProfile: jest.fn(),
    checkShareTarget: jest.fn(),
    getSharedProfile: jest.fn(),
    getProfessionalCv: jest.fn(),
    getFieldSuggestion: jest.fn(),
    sendCvByEmail: jest.fn(async () => undefined),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [
        {
          provide: ProfilesService,
          useValue: profilesServiceMock,
        },
        {
          provide: PremiumGuard,
          useValue: { canActivate: () => true },
        },
        {
          provide: Reflector,
          useValue: { getAllAndOverride: () => false },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(async () => ({ id: 1, pricingPlan: 'free' })),
          },
        },
        {
          provide: APP_GUARD,
          useValue: {
            canActivate: (context: any) => {
              const req = context.switchToHttp().getRequest();
              req.user = { userId: 1, pricingPlan: 'free' };
              return true;
            },
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication({ bodyParser: false });
    app.use(json({ limit: '10mb' }));
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('Oversized pdfBase64 returns 413', async () => {
    const oversizedBuffer = Buffer.alloc(CV_UPLOAD_MAX_SIZE + 1, 0x61);
    const oversizedBase64 = oversizedBuffer.toString('base64');

    await request(app.getHttpServer())
      .post('/api/profiles/me/send-cv-email')
      .send({ email: 'recipient@example.com', pdfBase64: oversizedBase64 })
      .expect(413);
  });

  it('Valid small pdfBase64 returns 200', async () => {
    const smallBase64 = Buffer.from('%PDF-1.4\nsmall').toString('base64');

    await request(app.getHttpServer())
      .post('/api/profiles/me/send-cv-email')
      .send({ email: 'recipient@example.com', pdfBase64: smallBase64 })
      .expect(200);
  });

  it('Invalid base64 string returns 400', async () => {
    await request(app.getHttpServer())
      .post('/api/profiles/me/send-cv-email')
      .send({ email: 'recipient@example.com', pdfBase64: '%%%not-base64%%%' })
      .expect(400);
  });
});
