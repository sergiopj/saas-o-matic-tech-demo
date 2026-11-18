import { DatabaseSeederService, SEED_CUSTOMERS } from './database-seeder.service';
import type { CustomerRepositoryPort } from '../../../modules/customers/application/ports/out/customer-repository.port';
import type { SimulationRepositoryPort } from '../../../modules/simulations/application/ports/out/simulation-repository.port';
import { Customer } from '../../../modules/customers/domain/entities/customer.entity';
import { Simulation } from '../../../modules/simulations/domain/entities/simulation.entity';

describe('DatabaseSeederService', () => {
  let service: DatabaseSeederService;
  let mockCustomerRepo: jest.Mocked<CustomerRepositoryPort>;
  let mockSimulationRepo: jest.Mocked<SimulationRepositoryPort>;

  beforeEach(() => {
    mockCustomerRepo = {
      save: jest.fn().mockImplementation((c: Customer) => Promise.resolve(c)),
      findById: jest.fn().mockResolvedValue(null),
      findByTaxId: jest.fn().mockResolvedValue(null),
      search: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    };

    mockSimulationRepo = {
      save: jest.fn().mockImplementation((s: Simulation) => Promise.resolve(s)),
      findByCustomerId: jest.fn().mockResolvedValue([]),
    };

    service = new DatabaseSeederService(mockCustomerRepo, mockSimulationRepo);
  });

  it('should skip seeding if database already has customers and force is default false', async () => {
    mockCustomerRepo.search.mockResolvedValueOnce({ items: [], total: 10 });

    const result = await service.seed();

    expect(result.customersCount).toBe(10);
    expect(result.simulationsCount).toBe(0);
    expect(mockCustomerRepo.save).not.toHaveBeenCalled();
    expect(mockSimulationRepo.save).not.toHaveBeenCalled();
  });

  it('should seed all customers and simulations when database is empty', async () => {
    mockCustomerRepo.search.mockResolvedValueOnce({ items: [], total: 0 });
    mockCustomerRepo.findById.mockResolvedValue(null);
    mockSimulationRepo.findByCustomerId.mockResolvedValue([]);

    const result = await service.seed(false);

    expect(result.customersCount).toBe(SEED_CUSTOMERS.length);
    expect(mockCustomerRepo.save).toHaveBeenCalledTimes(SEED_CUSTOMERS.length);
    expect(result.simulationsCount).toBeGreaterThan(0);
    expect(mockSimulationRepo.save).toHaveBeenCalledTimes(result.simulationsCount);
  });

  it('should call seed(false) on onApplicationBootstrap', async () => {
    const seedSpy = jest.spyOn(service, 'seed').mockResolvedValue({ customersCount: 5, simulationsCount: 2 });

    await service.onApplicationBootstrap();

    expect(seedSpy).toHaveBeenCalledWith(false);
  });

  it('should skip seeding on application bootstrap if SKIP_SEEDING is true', async () => {
    process.env.SKIP_SEEDING = 'true';
    const seedSpy = jest.spyOn(service, 'seed');

    await service.onApplicationBootstrap();

    expect(seedSpy).not.toHaveBeenCalled();
    delete process.env.SKIP_SEEDING;
  });

  it('should skip already existing simulations for an existing customer during force seed', async () => {
    mockCustomerRepo.search.mockResolvedValueOnce({ items: [], total: 5 });
    const firstSeed = SEED_CUSTOMERS[0];
    const existingCustomer = Customer.reconstitute({
      id: firstSeed.id,
      companyName: firstSeed.companyName,
      taxId: firstSeed.taxId,
      email: firstSeed.email,
      country: firstSeed.country,
      selectedPlan: firstSeed.selectedPlan,
      createdAt: firstSeed.createdAt,
    });

    mockCustomerRepo.findById.mockResolvedValue(existingCustomer);
    // Simulate first simulation already exists
    const existingSim = Simulation.create(
      {
        id: firstSeed.simulations[0].id,
        customerId: firstSeed.id,
        customerCountry: firstSeed.country,
        activeUsers: firstSeed.simulations[0].activeUsers,
        storageGb: firstSeed.simulations[0].storageGb,
        apiCalls: firstSeed.simulations[0].apiCalls,
      },
      () => firstSeed.simulations[0].id,
    );
    mockSimulationRepo.findByCustomerId.mockResolvedValue([existingSim]);

    const result = await service.seed(true);

    // Customer already existed, so customersCount for this run = 0
    expect(mockCustomerRepo.save).not.toHaveBeenCalled();
    // Only missing simulations are saved
    expect(result.simulationsCount).toBeGreaterThanOrEqual(1);
  });

  it('should find existing customer by taxId when not found by id during seed', async () => {
    mockCustomerRepo.search.mockResolvedValueOnce({ items: [], total: 0 });
    const firstSeed = SEED_CUSTOMERS[0];
    const existingCustomer = Customer.reconstitute({
      id: firstSeed.id,
      companyName: firstSeed.companyName,
      taxId: firstSeed.taxId,
      email: firstSeed.email,
      country: firstSeed.country,
      selectedPlan: firstSeed.selectedPlan,
      createdAt: firstSeed.createdAt,
    });

    mockCustomerRepo.findById.mockResolvedValue(null);
    mockCustomerRepo.findByTaxId.mockResolvedValue(existingCustomer);
    mockSimulationRepo.findByCustomerId.mockResolvedValue([]);

    const result = await service.seed(true);
    expect(result.customersCount).toBe(0);
  });
});
