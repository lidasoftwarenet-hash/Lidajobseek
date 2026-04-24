import { Test, TestingModule } from '@nestjs/testing';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

describe('ProfilesController', () => {
  let controller: ProfilesController;
  let service: ProfilesService;

  const mockService = {
    getProfileWithLastCv: jest.fn(),
    updateProfile: jest.fn(),
    checkShareTarget: jest.fn(),
    getSharedProfile: jest.fn(),
    getProfessionalCv: jest.fn(),
    getFieldSuggestion: jest.fn(),
  };

  const mockReq = { user: { userId: 123 } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilesController],
      providers: [{ provide: ProfilesService, useValue: mockService }],
    }).compile();

    controller = module.get<ProfilesController>(ProfilesController);
    service = module.get<ProfilesService>(ProfilesService);

    jest.clearAllMocks();
  });

  describe('getMyProfile', () => {
    it('should call service.getProfileWithLastCv', async () => {
      await controller.getMyProfile(mockReq);
      expect(service.getProfileWithLastCv).toHaveBeenCalledWith(123);
    });
  });

  describe('shareProfile', () => {
    it('should call getSharedProfile if user exists', async () => {
      mockService.checkShareTarget.mockResolvedValue({ exists: true, userId: 456 });
      mockService.getSharedProfile.mockResolvedValue({ id: 1 });

      const dto = { email: 'test@test.com' };
      const result = await controller.shareProfile(dto, mockReq);

      expect(result.exists).toBe(true);
      expect(service.getSharedProfile).toHaveBeenCalledWith(123, 'test@test.com');
    });

    it('should return null profile if user does not exist', async () => {
      mockService.checkShareTarget.mockResolvedValue({ exists: false });

      const dto = { email: 'none@test.com' };
      const result = await controller.shareProfile(dto, mockReq);

      expect(result.exists).toBe(false);
      expect(result.profile).toBeNull();
    });
  });

  describe('getProfessionalCv', () => {
    it('should pass true to service if ai query is not "false"', async () => {
      await controller.getProfessionalCv(mockReq, undefined);
      expect(service.getProfessionalCv).toHaveBeenCalledWith(123, true);

      await controller.getProfessionalCv(mockReq, 'true');
      expect(service.getProfessionalCv).toHaveBeenCalledWith(123, true);
    });

    it('should pass false to service if ai query is "false"', async () => {
      await controller.getProfessionalCv(mockReq, 'false');
      expect(service.getProfessionalCv).toHaveBeenCalledWith(123, false);
    });
  });
});
