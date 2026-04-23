import { Test, TestingModule } from '@nestjs/testing';
import { ProcessesService } from './processes.service';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Process } from './process.entity';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { NotFoundException } from '@nestjs/common';
import { User } from '../users/user.entity';

describe('ProcessesService', () => {
  let service: ProcessesService;
  let repo: EntityRepository<Process>;
  let em: EntityManager;

  const mockRepo = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockEm = {
    getReference: jest.fn(),
    persistAndFlush: jest.fn(),
    persist: jest.fn(),
    flush: jest.fn(),
    removeAndFlush: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessesService,
        { provide: getRepositoryToken(Process), useValue: mockRepo },
        { provide: EntityManager, useValue: mockEm },
      ],
    }).compile();

    service = module.get<ProcessesService>(ProcessesService);
    repo = module.get<EntityRepository<Process>>(getRepositoryToken(Process));
    em = module.get<EntityManager>(EntityManager);

    jest.clearAllMocks();
  });

  describe('isClosedStage (private)', () => {
    it('should identify closed stages correctly', () => {
      // Accessing private method via bracket notation for testing
      expect((service as any).isClosedStage('Rejected')).toBe(true);
      expect((service as any).isClosedStage('REJECT')).toBe(true);
      expect((service as any).isClosedStage('Withdrawn')).toBe(true);
      expect((service as any).isClosedStage('In Progress')).toBe(false);
    });
  });

  describe('create', () => {
    it('should normalize scores and dates during creation', async () => {
      const dto = {
        companyName: 'Test',
        scoreTech: '', // Should become 0
        salaryExpectation: '', // Should become null
        initialInviteDate: '2026-04-01',
      };
      mockEm.getReference.mockReturnValue({});
      mockRepo.create.mockImplementation(data => data);

      await service.create(dto as any, 1);

      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        scoreTech: 0,
        salaryExpectation: null,
        initialInviteDate: expect.any(Date),
      }));
    });
  });

  describe('findAll', () => {
    it('should update stale processes and return processes with interaction count', async () => {
      const userId = 1;
      const mockProcesses = [
        { id: 1, currentStage: 'Applied', interactions: [{}, {}], reviews: [] },
      ];
      mockRepo.find.mockResolvedValue(mockProcesses);
      
      // Verification of updateStaleProcesses call (it's called internally)
      await service.findAll(userId);

      expect(mockRepo.find).toHaveBeenCalled();
      expect(mockEm.flush).toHaveBeenCalled(); // From updateStaleProcesses
    });
  });

  describe('updateStaleProcesses (private automation)', () => {
    it('should update processes to "No Response (14+ Days)" if inactive', async () => {
      const userId = 1;
      const staleProcess = { id: 1, currentStage: 'Applied', updatedAt: new Date(2020, 1, 1) };
      mockRepo.find.mockResolvedValue([staleProcess]);

      await (service as any).updateStaleProcesses(userId);

      expect(staleProcess.currentStage).toBe('No Response (14+ Days)');
      expect(mockEm.flush).toHaveBeenCalled();
    });

    it('should NOT update closed processes even if stale', async () => {
      const userId = 1;
      const rejectedProcess = { id: 1, currentStage: 'Rejected', updatedAt: new Date(2020, 1, 1) };
      mockRepo.find.mockResolvedValue([]); // Mocking that nothing was found by the filter

      await (service as any).updateStaleProcesses(userId);
      expect(mockEm.flush).not.toHaveBeenCalled();
    });
  });

  describe('importData', () => {
    it('should deep clone relations and handle dates', async () => {
      const data = [{
        companyName: 'Imported',
        interactions: [{ date: '2026-05-01' }],
      }];
      mockEm.create.mockReturnValue({});
      mockRepo.create.mockReturnValue({ interactions: { add: jest.fn() }, contacts: { add: jest.fn() }, reviews: { add: jest.fn() } });
      
      const result = await service.importData(data, 'append', 1);

      expect(result.count).toBe(1);
      expect(mockEm.persist).toHaveBeenCalled();
    });

    it('should delete existing user data in overwrite mode', async () => {
      mockRepo.find.mockResolvedValue([{ id: 5 }]);
      await service.importData([], 'overwrite', 1);
      expect(mockEm.removeAndFlush).toHaveBeenCalled();
    });
  });
});
