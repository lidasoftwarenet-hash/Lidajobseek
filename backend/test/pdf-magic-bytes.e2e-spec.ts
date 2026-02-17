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

describe('PDF magic-byte validation (e2e)', () => {
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
    await app.close();
  });

  it('Valid PDF accepted', async () => {
    const validPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

    await request(app.getHttpServer())
      .post('/api/profiles/me/send-cv-email')
      .field('email', 'recipient@example.com')
      .attach('pdf', validPdf, { filename: 'cv.pdf', contentType: 'application/pdf' })
      .expect(200);
  });

  it('Spoofed file with PDF mimetype rejected', async () => {
    const spoofed = Buffer.from('this is plain text pretending to be pdf');

    await request(app.getHttpServer())
      .post('/api/profiles/me/send-cv-email')
      .field('email', 'recipient@example.com')
      .attach('pdf', spoofed, { filename: 'fake.pdf', contentType: 'application/pdf' })
      .expect(400);
  });

  it('Base64 non-PDF rejected', async () => {
    const nonPdfBase64 = Buffer.from('not a pdf binary').toString('base64');

    await request(app.getHttpServer())
      .post('/api/profiles/me/send-cv-email')
      .send({ email: 'recipient@example.com', pdfBase64: nonPdfBase64 })
      .expect(400);
  });
});
