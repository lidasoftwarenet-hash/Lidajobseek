import { Test, TestingModule } from '@nestjs/testing';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

describe('ContactsController', () => {
  let controller: ContactsController;
  let service: ContactsService;

  const mockContactsService = {
    create: jest.fn(),
    findAllByProcess: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockRequest = {
    user: { userId: 100 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [
        {
          provide: ContactsService,
          useValue: mockContactsService,
        },
      ],
    }).compile();

    controller = module.get<ContactsController>(ContactsController);
    service = module.get<ContactsService>(ContactsService);
    
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call contactsService.create with data and userId', async () => {
      const data = { name: 'Test' };
      await controller.create(data, mockRequest);
      expect(service.create).toHaveBeenCalledWith(data, 100);
    });
  });

  describe('findAll', () => {
    it('should call contactsService.findAllByProcess with processId and userId', async () => {
      const processId = '1';
      await controller.findAll(processId, mockRequest);
      expect(service.findAllByProcess).toHaveBeenCalledWith(1, 100);
    });
  });

  describe('update', () => {
    it('should call contactsService.update with id, data and userId', async () => {
      const id = '1';
      const data = { name: 'Test' };
      await controller.update(id, data, mockRequest);
      expect(service.update).toHaveBeenCalledWith(1, data, 100);
    });
  });

  describe('remove', () => {
    it('should call contactsService.remove with id and userId', async () => {
      const id = '1';
      await controller.remove(id, mockRequest);
      expect(service.remove).toHaveBeenCalledWith(1, 100);
    });
  });
});
