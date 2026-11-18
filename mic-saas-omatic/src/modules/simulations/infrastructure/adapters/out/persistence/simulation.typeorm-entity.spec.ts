import { SimulationTypeOrmEntity } from './simulation.typeorm-entity';

describe('SimulationTypeOrmEntity', () => {
  it('should instantiate and hold simulation entity properties', () => {
    const entity = new SimulationTypeOrmEntity();
    entity.id = 'sim-1';
    entity.customerId = 'cust-1';
    entity.activeUsers = 10;
    entity.storageGb = 50;
    entity.apiCalls = 1000;
    entity.monthlyBaseCost = 100;
    entity.taxRate = 0.21;
    entity.taxAmount = 21;
    entity.totalCost = 121;
    entity.currency = 'EUR';
    entity.createdAt = new Date('2026-01-01');

    expect(entity.id).toBe('sim-1');
    expect(entity.customerId).toBe('cust-1');
    expect(entity.totalCost).toBe(121);
    expect(entity.currency).toBe('EUR');
  });
});
