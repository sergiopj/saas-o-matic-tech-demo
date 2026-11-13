import { CustomerPersistenceMapper } from './customer-persistence.mapper';
import { Customer } from '../../../../domain/entities/customer.entity';
import { CustomerTypeOrmEntity } from './customer.typeorm-entity';

describe('CustomerPersistenceMapper', () => {
  const fixedDate = new Date('2026-05-10T12:00:00.000Z');

  it('should map a pure domain Customer to a CustomerTypeOrmEntity', () => {
    const domainCustomer = Customer.reconstitute({
      id: 'uuid-123',
      companyName: 'Acme Corp',
      taxId: 'B12345674',
      email: 'acme@corp.es',
      country: 'ES',
      selectedPlan: 'Growth',
      createdAt: fixedDate,
    });

    const ormEntity = CustomerPersistenceMapper.toTypeOrm(domainCustomer);

    expect(ormEntity.id).toBe('uuid-123');
    expect(ormEntity.companyName).toBe('Acme Corp');
    expect(ormEntity.taxId).toBe('B12345674');
    expect(ormEntity.email).toBe('acme@corp.es');
    expect(ormEntity.country).toBe('ES');
    expect(ormEntity.selectedPlan).toBe('Growth');
    expect(ormEntity.createdAt).toBe(fixedDate);
  });

  it('should map a CustomerTypeOrmEntity to a pure domain Customer via reconstitute', () => {
    const ormEntity = new CustomerTypeOrmEntity();
    ormEntity.id = 'uuid-456';
    ormEntity.companyName = 'Global Tech S.L.';
    ormEntity.taxId = 'A12345674';
    ormEntity.email = 'info@global.es';
    ormEntity.country = 'ES';
    ormEntity.selectedPlan = 'Enterprise';
    ormEntity.createdAt = fixedDate;

    const domainCustomer = CustomerPersistenceMapper.toDomain(ormEntity);

    expect(domainCustomer.getId()).toBe('uuid-456');
    expect(domainCustomer.getCompanyName()).toBe('Global Tech S.L.');
    expect(domainCustomer.getTaxId()).toBe('A12345674');
    expect(domainCustomer.getEmail()).toBe('info@global.es');
    expect(domainCustomer.getCountry()).toBe('ES');
    expect(domainCustomer.getSelectedPlan()).toBe('Enterprise');
    expect(domainCustomer.getCreatedAt()).toBe(fixedDate);
  });
});
