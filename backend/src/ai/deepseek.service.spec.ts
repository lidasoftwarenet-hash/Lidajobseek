import { Test, TestingModule } from '@nestjs/testing';
import { DeepSeekService } from './deepseek.service';
import { ConfigService } from '@nestjs/config';

describe('DeepSeekService', () => {
  let service: DeepSeekService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeepSeekService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<DeepSeekService>(DeepSeekService);
    configService = module.get<ConfigService>(ConfigService);

    // Mock global fetch
    (global as any).fetch = jest.fn();
    jest.clearAllMocks();
  });

  it('should be disabled if API key is missing', () => {
    mockConfigService.get.mockReturnValue(undefined);
    const newService = new DeepSeekService(configService);
    expect(newService.isEnabled()).toBe(false);
  });

  describe('generateProfessionalCv', () => {
    const prompt = 'Test prompt';

    it('should return original prompt if API key is missing', async () => {
      mockConfigService.get.mockReturnValue(undefined);
      const result = await service.generateProfessionalCv(prompt);
      expect(result).toBe(prompt);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return content from AI on successful 200 response', async () => {
      mockConfigService.get.mockImplementation(key => {
        if (key === 'DEEPSEEK_API_KEY') return 'sk-test';
        return undefined;
      });
      // Re-instantiate to pick up the key
      const activeService = new DeepSeekService(configService);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Improved content' } }]
        })
      });

      const result = await activeService.generateProfessionalCv(prompt);

      expect(result).toBe('Improved content');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should fallback to prompt if API returns error status', async () => {
      mockConfigService.get.mockReturnValue('sk-test');
      const activeService = new DeepSeekService(configService);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      });

      const result = await activeService.generateProfessionalCv(prompt);

      expect(result).toBe(prompt);
    });

    it('should fallback to prompt if API returns empty choices', async () => {
      mockConfigService.get.mockReturnValue('sk-test');
      const activeService = new DeepSeekService(configService);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [] })
      });

      const result = await activeService.generateProfessionalCv(prompt);

      expect(result).toBe(prompt);
    });
  });
});
