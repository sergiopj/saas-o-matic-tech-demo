import { CreateSimulationUseCase } from './create-simulation.use-case';
import type { CustomerRepositoryPort } from '../../../customers/application/ports/out/customer-repository.port';
import type { SimulationRepositoryPort } from '../ports/out/simulation-repository.port';
import { Customer } from '../../../customers/domain/entities/customer.entity';
import { Simulation } from '../../domain/entities/simulation.entity';
import { DomainError, EntityNotFoundError } from '../../../../shared/domain/domain.exception';

describe('CreateSimulationUseCase', () => {
  let useCase: CreateSimulationUseCase;
  let mockCustomerRepository: jest.Mocked<CustomerRepositoryPort>;
  let mockSimulationRepository: jest.Mocked<SimulationRepositoryPort>;

  const sampleCustomer = Customer.reconstitute({
    id: 'customer-uuid-1',
    companyName: 'Roams Corp',
    taxId: 'B12345674',
    email: 'billing@roams.es',
    country: 'ES',
    selectedPlan: 'Pro Enterprise',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  });

  beforeEach(() => {
    mockCustomerRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByTaxId: jest.fn(),
      search: jest.fn(),
    };

    mockSimulationRepository = {
      save: jest.fn().mockImplementation((sim: Simulation) => Promise.resolve(sim)),
      findByCustomerId: jest.fn(),
    };

    useCase = new CreateSimulationUseCase(
      mockCustomerRepository,
      mockSimulationRepository,
    );
  });

  it('should successfully create and save a simulation when customer exists', async () => {
    mockCustomerRepository.findById.mockResolvedValue(sampleCustomer);

    const result = await useCase.execute({
      customerId: 'customer-uuid-1',
      activeUsers: 15,
      storageGb: 50,
      apiCalls: 20000,
    });

    expect(mockCustomerRepository.findById).toHaveBeenCalledWith('customer-uuid-1');
    expect(mockSimulationRepository.save).toHaveBeenCalledTimes(1);

    expect(result.getCustomerId()).toBe('customer-uuid-1');
    expect(result.getActiveUsers()).toBe(15);
    expect(result.getStorageGb()).toBe(50);
    expect(result.getApiCalls()).toBe(20000);
    expect(result.getMonthlyBaseCost()).toBe(140);
    expect(result.getTaxRate()).toBe(0.21);
    expect(result.getTaxAmount()).toBe(29.40);
    expect(result.getTotalCost()).toBe(169.40);
    expect(result.getCurrency()).toBe('EUR');
  });

  it('should throw EntityNotFoundError and not save when customer does not exist', async () => {
    mockCustomerRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        customerId: 'non-existent-customer',
        activeUsers: 10,
        storageGb: 10,
        apiCalls: 1000,
      }),
    ).rejects.toThrow(EntityNotFoundError);

    expect(mockSimulationRepository.save).not.toHaveBeenCalled();
  });

  it('should throw DomainError and not save when command parameters violate domain invariants', async () => {
    mockCustomerRepository.findById.mockResolvedValue(sampleCustomer);

    await expect(
      useCase.execute({
        customerId: 'customer-uuid-1',
        activeUsers: -5,
        storageGb: 10,
        apiCalls: 1000,
      }),
    ).rejects.toThrow(DomainError);

    expect(mockSimulationRepository.save).not.toHaveBeenCalled();
  });
});
