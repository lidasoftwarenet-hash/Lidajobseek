import { Test, TestingModule } from '@nestjs/testing';
import { ProcessesController } from './processes.controller';
import { ProcessesService } from './processes.service';

describe('ProcessesController', () => {
  let controller: ProcessesController;
  let service: ProcessesService;

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    exportData: jest.fn(),
    importData: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockReq = { user: { userId: 123 } };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProcessesController],
      providers: [{ provide: ProcessesService, useValue: mockService }],
    }).compile();

    controller = module.get<ProcessesController>(ProcessesController);
    service = module.get<ProcessesService>(ProcessesService);

    jest.clearAllMocks();
  });

  it('should call findAll with correct userId', async () => {
    await controller.findAll(mockReq);
    expect(service.findAll).toHaveBeenCalledWith(123);
  });

  it('should call create with dto and userId', async () => {
    const dto = { companyName: 'Test' };
    await controller.create(dto as any, mockReq);
    expect(service.create).toHaveBeenCalledWith(dto, 123);
  });

  it('should call importData with mode and data', async () => {
    const data = { processes: [], mode: 'overwrite' as const };
    await controller.importData(data, mockReq);
    expect(service.importData).toHaveBeenCalledWith([], 'overwrite', 123);
  });
});
