import { SimulationPersistenceAdapter } from './simulation-persistence.adapter';
import { SimulationTypeOrmEntity } from './simulation.typeorm-entity';
import { Simulation } from '../../../../domain/entities/simulation.entity';
import { Repository } from 'typeorm';

describe('SimulationPersistenceAdapter (Secondary Adapter)', () => {
  let adapter: SimulationPersistenceAdapter;
  let mockTypeOrmRepo: jest.Mocked<Partial<Repository<SimulationTypeOrmEntity>>>;

  const sampleDate = new Date('2026-06-15T10:00:00.000Z');

  beforeEach(() => {
    mockTypeOrmRepo = {
      save: jest.fn(),
      find: jest.fn(),
    };
    adapter = new SimulationPersistenceAdapter(
      mockTypeOrmRepo as Repository<SimulationTypeOrmEntity>,
    );
  });

  it('should save a domain simulation into typeorm and return reconstituted domain simulation', async () => {
    const domainSimulation = Simulation.reconstitute({
      id: 'sim-uuid-1',
      customerId: 'customer-uuid-1',
      activeUsers: 15,
      storageGb: 50,
      apiCalls: 10000,
      monthlyBaseCost: 140,
      taxRate: 0.21,
      taxAmount: 29.40,
      totalCost: 169.40,
      currency: 'EUR',
      createdAt: sampleDate,
    });

    const savedOrm = new SimulationTypeOrmEntity();
    savedOrm.id = 'sim-uuid-1';
    savedOrm.customerId = 'customer-uuid-1';
    savedOrm.activeUsers = 15;
    savedOrm.storageGb = 50;
    savedOrm.apiCalls = 10000;
    savedOrm.monthlyBaseCost = 140;
    savedOrm.taxRate = 0.21;
    savedOrm.taxAmount = 29.40;
    savedOrm.totalCost = 169.40;
    savedOrm.createdAt = sampleDate;

    (mockTypeOrmRepo.save as jest.Mock).mockResolvedValue(savedOrm);

    const result = await adapter.save(domainSimulation);

    expect(result.getId()).toBe('sim-uuid-1');
    expect(result.getCustomerId()).toBe('customer-uuid-1');
    expect(result.getMonthlyBaseCost()).toBe(140);
    expect(result.getTotalCost()).toBe(169.40);
    expect(result.getCurrency()).toBe('EUR');
    expect(mockTypeOrmRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should find simulations by customerId ordered by createdAt descending', async () => {
    const newerOrm = new SimulationTypeOrmEntity();
    newerOrm.id = 'sim-uuid-2';
    newerOrm.customerId = 'customer-uuid-1';
    newerOrm.activeUsers = 30;
    newerOrm.storageGb = 100;
    newerOrm.apiCalls = 20000;
    newerOrm.monthlyBaseCost = 260;
    newerOrm.taxRate = 0.21;
    newerOrm.taxAmount = 54.60;
    newerOrm.totalCost = 314.60;
    newerOrm.createdAt = new Date('2026-06-16T12:00:00.000Z');

    const olderOrm = new SimulationTypeOrmEntity();
    olderOrm.id = 'sim-uuid-1';
    olderOrm.customerId = 'customer-uuid-1';
    olderOrm.activeUsers = 15;
    olderOrm.storageGb = 50;
    olderOrm.apiCalls = 10000;
    olderOrm.monthlyBaseCost = 140;
    olderOrm.taxRate = 0.21;
    olderOrm.taxAmount = 29.40;
    olderOrm.totalCost = 169.40;
    olderOrm.createdAt = new Date('2026-06-15T12:00:00.000Z');

    (mockTypeOrmRepo.find as jest.Mock).mockResolvedValue([newerOrm, olderOrm]);

    const results = await adapter.findByCustomerId('customer-uuid-1');

    expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
      where: { customerId: 'customer-uuid-1' },
      order: { createdAt: 'DESC' },
    });

    expect(results).toHaveLength(2);
    expect(results[0].getId()).toBe('sim-uuid-2');
    expect(results[1].getId()).toBe('sim-uuid-1');
    expect(results[0].getCurrency()).toBe('EUR');
  });

  it('should return empty array when customer has no simulations', async () => {
    (mockTypeOrmRepo.find as jest.Mock).mockResolvedValue([]);

    const results = await adapter.findByCustomerId('customer-without-sims');

    expect(results).toEqual([]);
    expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
      where: { customerId: 'customer-without-sims' },
      order: { createdAt: 'DESC' },
    });
  });
});
