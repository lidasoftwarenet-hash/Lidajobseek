import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/postgresql';
import { ResourcesController } from '../src/resources/resources.controller';
import { ResourcesService } from '../src/resources/resources.service';
import { Resource } from '../src/resources/resource.entity';
import { Folder } from '../src/resources/folder.entity';
import { User } from '../src/users/user.entity';

describe('Resources update ownership validation (e2e)', () => {
  let app: INestApplication<App>;

  const folders = [
    { id: 100, name: 'B-folder', user: 2 },
    { id: 200, name: 'A-folder', user: 1 },
    { id: 201, name: 'A-folder-2', user: 1 },
  ];

  const resources: any[] = [
    {
      id: 300,
      title: 'owned-resource',
      type: 'doc',
      content: 'content',
      user: 1,
      folder: folders[1],
    },
  ];

  const folderRepositoryMock = {
    findOne: jest.fn(async (where: any) => {
      const targetId = where?.id;
      const targetUser = where?.user;
      return folders.find((f) => f.id === targetId && f.user === targetUser) ?? null;
    }),
    find: jest.fn(async (where: any) => folders.filter((f) => f.user === where?.user)),
    create: jest.fn((data: any) => ({ id: 1000, ...data })),
  };

  const resourceRepositoryMock = {
    count: jest.fn(async () => resources.length),
    create: jest.fn((data: any) => ({ id: 5000, ...data })),
    find: jest.fn(async () => resources),
    findOne: jest.fn(async (where: any) => {
      const targetId = where?.id;
      const targetUser = where?.user;
      return resources.find((r) => r.id === targetId && r.user === targetUser) ?? null;
    }),
  };

  const emMock = {
    findOne: jest.fn(async (entity: any, where: any) => {
      if (entity === User) {
        return { id: where?.id, pricingPlan: 'free' };
      }
      return null;
    }),
    persistAndFlush: jest.fn(async () => undefined),
    flush: jest.fn(async () => undefined),
    removeAndFlush: jest.fn(async () => undefined),
    getReference: jest.fn((entity: any, id: number) => ({ entity, id })),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ResourcesController],
      providers: [
        ResourcesService,
        {
          provide: getRepositoryToken(Resource),
          useValue: resourceRepositoryMock,
        },
        {
          provide: getRepositoryToken(Folder),
          useValue: folderRepositoryMock,
        },
        {
          provide: EntityManager,
          useValue: emMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');

    app.use((req: any, _res: any, next: () => void) => {
      const userId = Number(req.headers['x-user-id'] || 1);
      req.user = { userId, pricingPlan: 'free' };
      next();
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('User A tries to move resource into User B folder -> 404', async () => {
    await request(app.getHttpServer())
      .put('/api/resources/300')
      .set('x-user-id', '1')
      .send({ folderId: 100 })
      .expect(404);
  });

  it('User moves resource to root (folderId null) -> 200 and folder null', async () => {
    const response = await request(app.getHttpServer())
      .put('/api/resources/300')
      .set('x-user-id', '1')
      .send({ folderId: null })
      .expect(200);

    expect(response.body?.folder).toBeNull();
  });

  it('User sends folderId = "abc" -> 400', async () => {
    await request(app.getHttpServer())
      .put('/api/resources/300')
      .set('x-user-id', '1')
      .send({ folderId: 'abc' })
      .expect(400);
  });

  it('Valid folder reassignment -> 200', async () => {
    const response = await request(app.getHttpServer())
      .put('/api/resources/300')
      .set('x-user-id', '1')
      .send({ folderId: 201 })
      .expect(200);

    expect(response.body?.folder?.id).toBe(201);
  });
});
