import { Test, TestingModule } from '@nestjs/testing';
import { ContactsService } from './contacts.service';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Contact } from './contact.entity';
import { Process } from '../processes/process.entity';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { NotFoundException } from '@nestjs/common';

describe('ContactsService', () => {
  let service: ContactsService;
  let contactRepository: EntityRepository<Contact>;
  let em: EntityManager;

  const mockContactRepository = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockEntityManager = {
    findOne: jest.fn(),
    persistAndFlush: jest.fn(),
    flush: jest.fn(),
    removeAndFlush: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: getRepositoryToken(Contact),
          useValue: mockContactRepository,
        },
        {
          provide: EntityManager,
          useValue: mockEntityManager,
        },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
    contactRepository = module.get<EntityRepository<Contact>>(getRepositoryToken(Contact));
    em = module.get<EntityManager>(EntityManager);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a contact if process exists', async () => {
      const data = { process: 1, name: 'John Doe' };
      const userId = 100;
      const mockProcess = { id: 1, user: userId };
      const mockContact = { id: 1, ...data };

      mockEntityManager.findOne.mockResolvedValue(mockProcess);
      mockContactRepository.create.mockReturnValue(mockContact);

      const result = await service.create(data, userId);

      expect(em.findOne).toHaveBeenCalledWith(Process, { id: 1, user: userId });
      expect(contactRepository.create).toHaveBeenCalledWith(data);
      expect(em.persistAndFlush).toHaveBeenCalledWith(mockContact);
      expect(result).toBe(mockContact);
    });

    it('should throw NotFoundException if process does not exist or user unauthorized', async () => {
      const data = { process: 999, name: 'John Doe' };
      const userId = 100;

      mockEntityManager.findOne.mockResolvedValue(null);

      await expect(service.create(data, userId)).rejects.toThrow(NotFoundException);
      expect(em.findOne).toHaveBeenCalled();
      expect(contactRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAllByProcess', () => {
    it('should return all contacts for a specific process', async () => {
      const processId = 1;
      const userId = 100;
      const mockContacts = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }];

      mockContactRepository.find.mockResolvedValue(mockContacts);

      const result = await service.findAllByProcess(processId, userId);

      expect(contactRepository.find).toHaveBeenCalledWith({
        process: { id: processId, user: userId },
      });
      expect(result).toBe(mockContacts);
    });
  });

  describe('update', () => {
    it('should update and return the contact if found', async () => {
      const id = 1;
      const userId = 100;
      const data = { name: 'Updated Name' };
      const mockContact = { id, name: 'Old Name' };

      mockContactRepository.findOne.mockResolvedValue(mockContact);

      const result = await service.update(id, data, userId);

      expect(contactRepository.findOne).toHaveBeenCalledWith({
        id,
        process: { user: userId },
      });
      expect(mockContact.name).toBe('Updated Name');
      expect(em.flush).toHaveBeenCalled();
      expect(result).toBe(mockContact);
    });

    it('should throw NotFoundException if contact fails to be found for user', async () => {
      mockContactRepository.findOne.mockResolvedValue(null);
      await expect(service.update(1, {}, 100)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove and return the contact if found', async () => {
      const id = 1;
      const userId = 100;
      const mockContact = { id };

      mockContactRepository.findOne.mockResolvedValue(mockContact);

      const result = await service.remove(id, userId);

      expect(contactRepository.findOne).toHaveBeenCalledWith({
        id,
        process: { user: userId },
      });
      expect(em.removeAndFlush).toHaveBeenCalledWith(mockContact);
      expect(result).toBe(mockContact);
    });

    it('should throw NotFoundException if contact not found on removal', async () => {
      mockContactRepository.findOne.mockResolvedValue(null);
      await expect(service.remove(1, 100)).rejects.toThrow(NotFoundException);
    });
  });
});
