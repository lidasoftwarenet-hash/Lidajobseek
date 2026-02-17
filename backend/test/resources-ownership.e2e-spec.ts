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

describe('Resources ownership validation (e2e)', () => {
  let app: INestApplication<App>;

  const folders = [
    { id: 100, name: 'B-folder', user: 2 },
    { id: 200, name: 'A-folder', user: 1 },
    { id: 201, name: 'A-folder-2', user: 1 },
  ];

  const resources: any[] = [
    {
      id: 300,
      title: 'owned-existing-resource',
      type: 'doc',
      content: 'owned content',
      user: 1,
      folder: folders[1],
    },
  ];

  let nextFolderId = 1000;
  let nextResourceId = 5000;

  const folderRepositoryMock = {
    findOne: jest.fn(async (where: any) => {
      const targetId = where?.id;
      const targetUser = where?.user;
      return (
        folders.find((f) => f.id === targetId && f.user === targetUser) ?? null
      );
    }),
    find: jest.fn(async (where: any) =>
      folders.filter((f) => f.user === where?.user),
    ),
    create: jest.fn((data: any) => ({ id: nextFolderId++, ...data })),
  };

  const resourceRepositoryMock = {
    count: jest.fn(async (where: any) =>
      resources.filter((r) => r.user === where?.user).length,
    ),
    create: jest.fn((data: any) => {
      const created = { id: nextResourceId++, ...data };
      resources.push(created);
      return created;
    }),
    find: jest.fn(async () => resources),
    findOne: jest.fn(async (where: any) => {
      const targetId = where?.id;
      const targetUser = where?.user;
      return (
        resources.find((r) => r.id === targetId && r.user === targetUser) ?? null
      );
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

  it('User A cannot create resource inside User B folder -> 404', async () => {
    await request(app.getHttpServer())
      .post('/api/resources')
      .set('x-user-id', '1')
      .send({
        title: 'forbidden',
        type: 'doc',
        content: 'hello',
        folderId: 100,
      })
      .expect(404);
  });

  it('User A cannot create child folder under User B parent -> 404', async () => {
    await request(app.getHttpServer())
      .post('/api/resources/folders')
      .set('x-user-id', '1')
      .send({
        name: 'child-folder',
        parentId: 100,
      })
      .expect(404);
  });

  it('Valid ownership still works', async () => {
    const createResourceResponse = await request(app.getHttpServer())
      .post('/api/resources')
      .set('x-user-id', '1')
      .send({
        title: 'owned-resource',
        type: 'doc',
        content: 'ok',
        folderId: 200,
      })
      .expect(201);

    expect(createResourceResponse.body?.folder?.id).toBe(200);

    const createFolderResponse = await request(app.getHttpServer())
      .post('/api/resources/folders')
      .set('x-user-id', '1')
      .send({
        name: 'owned-child-folder',
        parentId: 200,
      })
      .expect(201);

    expect(createFolderResponse.body?.parent?.id).toBe(200);
  });

  it('User A cannot move resource to User B folder -> 404', async () => {
    await request(app.getHttpServer())
      .put('/api/resources/300')
      .set('x-user-id', '1')
      .send({ folderId: 100 })
      .expect(404);
  });

  it('Valid folder reassignment still works', async () => {
    const response = await request(app.getHttpServer())
      .put('/api/resources/300')
      .set('x-user-id', '1')
      .send({ folderId: 201 })
      .expect(200);

    expect(response.body?.folder?.id).toBe(201);
  });
});
