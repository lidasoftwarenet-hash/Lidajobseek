import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object from payload', async () => {
      const payload = { sub: 1, email: 'test@test.com', pricingPlan: 'premium' };
      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 1,
        id: 1,
        email: 'test@test.com',
        pricingPlan: 'premium',
      });
    });

    it('should default to free pricing plan if not in payload', async () => {
      const payload = { sub: 1, email: 'test@test.com' };
      const result = await strategy.validate(payload);

      expect(result.pricingPlan).toBe('free');
    });
  });
});
