import { SimulationController } from './simulation.controller';
import { CreateSimulationUseCase } from '../../../../application/use-cases/create-simulation.use-case';
import { Simulation } from '../../../../domain/entities/simulation.entity';
import { CreateSimulationDto } from './dto/create-simulation.dto';

describe('SimulationController (Primary Adapter)', () => {
  let controller: SimulationController;
  let mockCreateSimulationUseCase: jest.Mocked<Partial<CreateSimulationUseCase>>;

  const fixedDate = new Date('2026-06-15T10:00:00.000Z');
  const sampleSimulation = Simulation.reconstitute({
    id: 'sim-uuid-1',
    customerId: 'customer-uuid-1',
    activeUsers: 15,
    storageGb: 50,
    apiCalls: 20000,
    monthlyBaseCost: 140,
    taxRate: 0.21,
    taxAmount: 29.40,
    totalCost: 169.40,
    currency: 'EUR',
    createdAt: fixedDate,
  });

  beforeEach(() => {
    mockCreateSimulationUseCase = {
      execute: jest.fn().mockResolvedValue(sampleSimulation),
    };

    controller = new SimulationController(
      mockCreateSimulationUseCase as CreateSimulationUseCase,
    );
  });

  it('should create simulation and return SimulationResponseDto with 201 status shape', async () => {
    const dto: CreateSimulationDto = {
      customerId: 'customer-uuid-1',
      activeUsers: 15,
      storageGb: 50,
      apiCalls: 20000,
    };

    const response = await controller.create(dto);

    expect(mockCreateSimulationUseCase.execute).toHaveBeenCalledWith(dto);
    expect(response.id).toBe('sim-uuid-1');
    expect(response.customerId).toBe('customer-uuid-1');
    expect(response.activeUsers).toBe(15);
    expect(response.storageGb).toBe(50);
    expect(response.apiCalls).toBe(20000);
    expect(response.monthlyBaseCost).toBe(140);
    expect(response.taxRate).toBe(0.21);
    expect(response.taxAmount).toBe(29.40);
    expect(response.totalCost).toBe(169.40);
    expect(response.currency).toBe('EUR');
    expect(response.createdAt).toBe(fixedDate.toISOString());
  });
});
