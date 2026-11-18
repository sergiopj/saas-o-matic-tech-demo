import { CustomerTypeOrmEntity } from './customer.typeorm-entity';

describe('CustomerTypeOrmEntity', () => {
  it('should instantiate and hold customer entity properties', () => {
    const entity = new CustomerTypeOrmEntity();
    entity.id = 'uuid-1';
    entity.companyName = 'Acme Corp';
    entity.taxId = 'B12345674';
    entity.email = 'billing@acme.com';
    entity.country = 'ES';
    entity.selectedPlan = 'Pro';
    entity.createdAt = new Date('2026-01-01');

    expect(entity.id).toBe('uuid-1');
    expect(entity.companyName).toBe('Acme Corp');
    expect(entity.taxId).toBe('B12345674');
    expect(entity.email).toBe('billing@acme.com');
    expect(entity.country).toBe('ES');
    expect(entity.selectedPlan).toBe('Pro');
    expect(entity.createdAt).toBeDefined();
  });
});
