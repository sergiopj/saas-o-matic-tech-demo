import { CustomerPersistenceAdapter } from './customer-persistence.adapter';
import { CustomerTypeOrmEntity } from './customer.typeorm-entity';
import { Customer } from '../../../../domain/entities/customer.entity';
import { Repository } from 'typeorm';

describe('CustomerPersistenceAdapter (Secondary Adapter)', () => {
  let adapter: CustomerPersistenceAdapter;
  let mockTypeOrmRepo: jest.Mocked<Partial<Repository<CustomerTypeOrmEntity>>>;

  const sampleDate = new Date('2026-06-01T10:00:00.000Z');

  beforeEach(() => {
    mockTypeOrmRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };
    adapter = new CustomerPersistenceAdapter(
      mockTypeOrmRepo as Repository<CustomerTypeOrmEntity>,
    );
  });

  it('should save a domain customer into typeorm and return domain customer', async () => {
    const domainCustomer = Customer.reconstitute({
      id: 'uuid-1',
      companyName: 'Roams Corp',
      taxId: 'B12345674',
      email: 'acme@corp.es',
      country: 'ES',
      selectedPlan: 'Pro',
      createdAt: sampleDate,
    });

    const savedOrm = new CustomerTypeOrmEntity();
    savedOrm.id = 'uuid-1';
    savedOrm.companyName = 'Roams Corp';
    savedOrm.taxId = 'B12345674';
    savedOrm.email = 'acme@corp.es';
    savedOrm.country = 'ES';
    savedOrm.selectedPlan = 'Pro';
    savedOrm.createdAt = sampleDate;

    (mockTypeOrmRepo.save as jest.Mock).mockResolvedValue(savedOrm);

    const result = await adapter.save(domainCustomer);

    expect(result.getId()).toBe('uuid-1');
    expect(result.getTaxId()).toBe('B12345674');
    expect(mockTypeOrmRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should find a customer by taxId and map to domain', async () => {
    const foundOrm = new CustomerTypeOrmEntity();
    foundOrm.id = 'uuid-2';
    foundOrm.companyName = 'Telecom Corp';
    foundOrm.taxId = 'A12345674';
    foundOrm.email = 'telecom@corp.es';
    foundOrm.country = 'ES';
    foundOrm.selectedPlan = 'Growth';
    foundOrm.createdAt = sampleDate;

    (mockTypeOrmRepo.findOne as jest.Mock).mockResolvedValue(foundOrm);

    const result = await adapter.findByTaxId('A12345674');

    expect(result).not.toBeNull();
    expect(result?.getId()).toBe('uuid-2');
    expect(result?.getCompanyName()).toBe('Telecom Corp');
  });

  it('should search with clean term for company and normalized term for taxId', async () => {
    (mockTypeOrmRepo.find as jest.Mock).mockResolvedValue([]);

    await adapter.search('  b - 1234  ');

    expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
      where: [{ companyName: expect.anything() }, { taxId: expect.anything() }],
      order: { createdAt: 'DESC' },
    });
  });
});
