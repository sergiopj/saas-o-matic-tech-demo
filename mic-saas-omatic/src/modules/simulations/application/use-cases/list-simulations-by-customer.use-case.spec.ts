import { ListSimulationsByCustomerUseCase } from './list-simulations-by-customer.use-case';
import type { SimulationRepositoryPort } from '../ports/out/simulation-repository.port';
import { Simulation } from '../../domain/entities/simulation.entity';

describe('ListSimulationsByCustomerUseCase', () => {
  let useCase: ListSimulationsByCustomerUseCase;
  let mockSimulationRepository: jest.Mocked<SimulationRepositoryPort>;

  const fixedDate = new Date('2026-06-15T10:00:00.000Z');
  const sampleSimulation = Simulation.reconstitute({
    id: 'sim-uuid-1',
    customerId: 'customer-uuid-1',
    activeUsers: 15,
    storageGb: 50,
    apiCalls: 20000,
    monthlyBaseCost: 140,
    taxRate: 0.21,
    taxAmount: 29.4,
    totalCost: 169.4,
    currency: 'EUR',
    createdAt: fixedDate,
  });

  beforeEach(() => {
    mockSimulationRepository = {
      save: jest.fn(),
      findByCustomerId: jest.fn().mockResolvedValue([sampleSimulation]),
    };

    useCase = new ListSimulationsByCustomerUseCase(
      mockSimulationRepository as unknown as SimulationRepositoryPort,
    );
  });

  it('should return simulations for a given customerId', async () => {
    const result = await useCase.execute('customer-uuid-1');

    expect(mockSimulationRepository.findByCustomerId).toHaveBeenCalledWith(
      'customer-uuid-1',
    );
    expect(result).toHaveLength(1);
    expect(result[0].getId()).toBe('sim-uuid-1');
    expect(result[0].getCustomerId()).toBe('customer-uuid-1');
  });

  it('should return empty array when customer has no simulations', async () => {
    mockSimulationRepository.findByCustomerId = jest.fn().mockResolvedValue([]);

    const result = await useCase.execute('customer-uuid-no-sims');

    expect(result).toHaveLength(0);
  });
});
