import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

describe('ReviewsController', () => {
  let controller: ReviewsController;
  let service: ReviewsService;

  const mockService = {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockReq = { user: { userId: 123 } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [{ provide: ReviewsService, useValue: mockService }],
    }).compile();

    controller = module.get<ReviewsController>(ReviewsController);
    service = module.get<ReviewsService>(ReviewsService);

    jest.clearAllMocks();
  });

  it('should call create with dto and userId', async () => {
    const dto = { processId: 1, content: 'Test' };
    await controller.create(dto as any, mockReq);
    expect(service.create).toHaveBeenCalledWith(dto, 123);
  });

  it('should call update with id, data, and userId', async () => {
    const dto = { content: 'Updated' };
    await controller.update(1, dto, mockReq);
    expect(service.update).toHaveBeenCalledWith(1, dto, 123);
  });

  it('should call remove with id and userId', async () => {
    await controller.remove(1, mockReq);
    expect(service.remove).toHaveBeenCalledWith(1, 123);
  });
});
