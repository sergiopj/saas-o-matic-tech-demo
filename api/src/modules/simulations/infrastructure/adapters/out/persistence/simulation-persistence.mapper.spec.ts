import { SimulationPersistenceMapper } from './simulation-persistence.mapper';
import { Simulation } from '../../../../domain/entities/simulation.entity';
import { SimulationTypeOrmEntity } from './simulation.typeorm-entity';

describe('SimulationPersistenceMapper', () => {
  const fixedDate = new Date('2026-06-15T14:30:00.000Z');

  it('should map a pure domain Simulation to a SimulationTypeOrmEntity', () => {
    const domainSimulation = Simulation.reconstitute({
      id: 'simulation-uuid-1',
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

    const ormEntity = SimulationPersistenceMapper.toTypeOrm(domainSimulation);

    expect(ormEntity.id).toBe('simulation-uuid-1');
    expect(ormEntity.customerId).toBe('customer-uuid-1');
    expect(ormEntity.activeUsers).toBe(15);
    expect(ormEntity.storageGb).toBe(50);
    expect(ormEntity.apiCalls).toBe(20000);
    expect(ormEntity.monthlyBaseCost).toBe(140);
    expect(ormEntity.taxRate).toBe(0.21);
    expect(ormEntity.taxAmount).toBe(29.40);
    expect(ormEntity.totalCost).toBe(169.40);
    expect(ormEntity.createdAt).toBe(fixedDate);
  });

  it('should map a SimulationTypeOrmEntity to a pure domain Simulation via reconstitute', () => {
    const ormEntity = new SimulationTypeOrmEntity();
    ormEntity.id = 'simulation-uuid-2';
    ormEntity.customerId = 'customer-uuid-2';
    ormEntity.activeUsers = 50;
    ormEntity.storageGb = 100.5;
    ormEntity.apiCalls = 50000;
    ormEntity.monthlyBaseCost = 420;
    ormEntity.taxRate = 0.19;
    ormEntity.taxAmount = 79.80;
    ormEntity.totalCost = 499.80;
    ormEntity.createdAt = fixedDate;

    const domainSimulation = SimulationPersistenceMapper.toDomain(ormEntity);

    expect(domainSimulation.getId()).toBe('simulation-uuid-2');
    expect(domainSimulation.getCustomerId()).toBe('customer-uuid-2');
    expect(domainSimulation.getActiveUsers()).toBe(50);
    expect(domainSimulation.getStorageGb()).toBe(100.5);
    expect(domainSimulation.getApiCalls()).toBe(50000);
    expect(domainSimulation.getMonthlyBaseCost()).toBe(420);
    expect(domainSimulation.getTaxRate()).toBe(0.19);
    expect(domainSimulation.getTaxAmount()).toBe(79.80);
    expect(domainSimulation.getTotalCost()).toBe(499.80);
    expect(domainSimulation.getCurrency()).toBe('EUR');
    expect(domainSimulation.getCreatedAt()).toBe(fixedDate);
  });

  it('should safely convert decimal strings from database driver to numbers', () => {
    const ormEntity = new SimulationTypeOrmEntity();
    ormEntity.id = 'simulation-uuid-3';
    ormEntity.customerId = 'customer-uuid-3';
    ormEntity.activeUsers = 10;
    ormEntity.storageGb = 10;
    ormEntity.apiCalls = 1000;
    // Simulating database drivers returning string representations for decimal columns
    (ormEntity as any).monthlyBaseCost = '100.00';
    (ormEntity as any).taxRate = '0.2100';
    (ormEntity as any).taxAmount = '21.00';
    (ormEntity as any).totalCost = '121.00';
    ormEntity.createdAt = fixedDate;

    const domainSimulation = SimulationPersistenceMapper.toDomain(ormEntity);

    expect(domainSimulation.getMonthlyBaseCost()).toBe(100);
    expect(typeof domainSimulation.getMonthlyBaseCost()).toBe('number');
    expect(domainSimulation.getTaxRate()).toBe(0.21);
    expect(typeof domainSimulation.getTaxRate()).toBe('number');
    expect(domainSimulation.getTaxAmount()).toBe(21);
    expect(domainSimulation.getTotalCost()).toBe(121);
    expect(domainSimulation.getCurrency()).toBe('EUR');
  });
});
