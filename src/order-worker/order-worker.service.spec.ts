import { Test, TestingModule } from '@nestjs/testing';
import { OrderWorkerService } from './order-worker.service';

describe('OrderWorkerService', () => {
  let service: OrderWorkerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderWorkerService],
    }).compile();

    service = module.get<OrderWorkerService>(OrderWorkerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
