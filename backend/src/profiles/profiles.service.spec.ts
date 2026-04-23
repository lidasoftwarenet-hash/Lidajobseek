import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesService } from './profiles.service';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Profile } from './profile.entity';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { UsersService } from '../users/users.service';
import { DeepSeekService } from '../ai/deepseek.service';
import { NotFoundException } from '@nestjs/common';
import { User } from '../users/user.entity';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let profileRepo: EntityRepository<Profile>;
  let em: EntityManager;
  let usersService: UsersService;
  let deepSeekService: DeepSeekService;

  const mockProfileRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockEm = {
    getReference: jest.fn(),
    persistAndFlush: jest.fn(),
    flush: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockDeepSeekService = {
    isEnabled: jest.fn(),
    generateProfessionalCv: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        { provide: getRepositoryToken(Profile), useValue: mockProfileRepo },
        { provide: EntityManager, useValue: mockEm },
        { provide: UsersService, useValue: mockUsersService },
        { provide: DeepSeekService, useValue: mockDeepSeekService },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
    profileRepo = module.get<EntityRepository<Profile>>(getRepositoryToken(Profile));
    em = module.get<EntityManager>(EntityManager);
    usersService = module.get<UsersService>(UsersService);
    deepSeekService = module.get<DeepSeekService>(DeepSeekService);

    jest.clearAllMocks();
  });

  describe('getOrCreateProfile', () => {
    it('should return existing profile if it exists', async () => {
      const existingProfile = { id: 1, user: 123 };
      mockProfileRepo.findOne.mockResolvedValue(existingProfile);

      const result = await service.getOrCreateProfile(123);

      expect(result).toBe(existingProfile);
      expect(mockProfileRepo.create).not.toHaveBeenCalled();
    });

    it('should create and return new profile if it does not exist', async () => {
      mockProfileRepo.findOne.mockResolvedValue(null);
      const newProfile = { id: 2 };
      mockProfileRepo.create.mockReturnValue(newProfile);

      const result = await service.getOrCreateProfile(123);

      expect(result).toBe(newProfile);
      expect(mockEm.persistAndFlush).toHaveBeenCalled();
    });
  });

  describe('getProfessionalCv', () => {
    const mockProfile = { id: 1, about: 'Original About', experience: 'Original' };

    it('should use deepSeekService if useAi is true and service is enabled', async () => {
      mockProfileRepo.findOne.mockResolvedValue(mockProfile);
      mockDeepSeekService.isEnabled.mockReturnValue(true);
      mockDeepSeekService.generateProfessionalCv.mockResolvedValue('{"about": "AI Improved About"}');

      const result = await service.getProfessionalCv(123, true);

      expect(result.about).toBe('AI Improved About');
      expect(result.aiEnabled).toBe(true);
    });

    it('should fallback to template if useAi is true but AI service is disabled', async () => {
      mockProfileRepo.findOne.mockResolvedValue(mockProfile);
      mockDeepSeekService.isEnabled.mockReturnValue(false);

      const result = await service.getProfessionalCv(123, true);

      expect(result.about).toBe('Original About');
      expect(result.aiEnabled).toBe(false);
    });

    it('should handle invalid JSON from AI service gracefully', async () => {
      mockProfileRepo.findOne.mockResolvedValue(mockProfile);
      mockDeepSeekService.isEnabled.mockReturnValue(true);
      mockDeepSeekService.generateProfessionalCv.mockResolvedValue('INVALID_JSON');

      const result = await service.getProfessionalCv(123, true);

      // Should default back to profile data
      expect(result.about).toBe('Original About');
    });
  });

  describe('getSharedProfile', () => {
    it('should return profile if recipient exists', async () => {
      mockUsersService.findOne.mockResolvedValue({ id: 456 });
      mockProfileRepo.findOne.mockResolvedValue({ id: 1 });

      const result = await service.getSharedProfile(123, 'friend@test.com');
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if recipient user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);
      await expect(service.getSharedProfile(123, 'none@test.com')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFieldSuggestion', () => {
    it('should return empty suggestion if AI service is disabled', async () => {
      mockDeepSeekService.isEnabled.mockReturnValue(false);
      const result = await service.getFieldSuggestion(123, 'about');
      expect(result.suggestion).toBe('');
      expect(result.aiEnabled).toBe(false);
    });
  });
});
