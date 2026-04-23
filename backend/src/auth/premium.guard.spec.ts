import { Test, TestingModule } from '@nestjs/testing';
import { PremiumGuard } from './premium.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('PremiumGuard', () => {
  let guard: PremiumGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const createMockContext = (user: any, requiresPremium = true): ExecutionContext => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ user }),
    }),
  } as unknown as ExecutionContext);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PremiumGuard,
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    guard = module.get<PremiumGuard>(PremiumGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should return true if requiresPremium is false', () => {
    mockReflector.getAllAndOverride.mockReturnValue(false);
    const context = createMockContext(null);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user is not authenticated', () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    const context = createMockContext(null);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('User not authenticated');
  });

  it('should throw ForbiddenException if user is not premium', () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    const context = createMockContext({ pricingPlan: 'free' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('This feature requires a premium account');
  });

  it('should return true if user is premium', () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    const context = createMockContext({ pricingPlan: 'premium' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should return true if user is enterprise', () => {
    mockReflector.getAllAndOverride.mockReturnValue(true);
    const context = createMockContext({ pricingPlan: 'enterprise' });
    expect(guard.canActivate(context)).toBe(true);
  });
});
