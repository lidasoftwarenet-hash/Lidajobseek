import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    verifyInvitationCode: jest.fn(),
    getPreferences: jest.fn(),
    updatePreferences: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return result from authService.login when credentials are valid', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const user = { id: 1, email: 'test@example.com' };
      const loginResult = { access_token: 'token', user };

      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.login.mockResolvedValue(loginResult);

      const result = await controller.login(loginDto);

      expect(result).toBe(loginResult);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(mockAuthService.login).toHaveBeenCalledWith(user);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      const loginDto = { email: 'test@example.com', password: 'wrongpassword' };
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should return result from authService.register', async () => {
      const registerDto = { email: 'test@example.com', password: 'password123', name: 'Test' };
      const registerResult = { id: 1, ...registerDto };
      mockAuthService.register.mockResolvedValue(registerResult);

      const result = await controller.register(registerDto);

      expect(result).toBe(registerResult);
      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('verifyCode', () => {
    it('should return result from authService.verifyInvitationCode', async () => {
      const code = 'SECRET';
      const verifyResult = { success: true };
      mockAuthService.verifyInvitationCode.mockResolvedValue(verifyResult);

      const result = await controller.verifyCode(code);

      expect(result).toBe(verifyResult);
      expect(mockAuthService.verifyInvitationCode).toHaveBeenCalledWith(code);
    });
  });

  describe('getPreferences', () => {
    it('should return preferences from authService.getPreferences', async () => {
      const req = { user: { userId: 1 } };
      const preferences = { theme: 'dark', country: 'US' };
      mockAuthService.getPreferences.mockResolvedValue(preferences);

      const result = await controller.getPreferences(req);

      expect(result).toBe(preferences);
      expect(mockAuthService.getPreferences).toHaveBeenCalledWith(1);
    });
  });

  describe('updatePreferences', () => {
    it('should return updated preferences from authService.updatePreferences', async () => {
      const req = { user: { userId: 1 } };
      const body = { theme: 'light' };
      const updatedPreferences = { theme: 'light', country: 'US' };
      mockAuthService.updatePreferences.mockResolvedValue(updatedPreferences);

      const result = await controller.updatePreferences(req, body);

      expect(result).toBe(updatedPreferences);
      expect(mockAuthService.updatePreferences).toHaveBeenCalledWith(1, body);
    });
  });
});
