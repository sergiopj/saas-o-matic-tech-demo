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
      findAndCount: jest.fn(),
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

  it('should return all customers ordered by createdAt DESC when no filters provided', async () => {
    (mockTypeOrmRepo.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

    const result = await adapter.search();

    expect(result).toEqual({ items: [], total: 0 });
    expect(mockTypeOrmRepo.findAndCount).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
  });

  it('should search with clean term for company, normalized term for taxId, and email', async () => {
    (mockTypeOrmRepo.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

    await adapter.search({ term: '  b - 1234  ' });

    expect(mockTypeOrmRepo.findAndCount).toHaveBeenCalledWith({
      where: [
        { companyName: expect.anything() },
        { taxId: expect.anything() },
        { email: expect.anything() },
      ],
      order: { createdAt: 'DESC' },
    });
  });

  it('should filter strictly by fiscal jurisdiction when only country is provided', async () => {
    (mockTypeOrmRepo.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

    await adapter.search({ country: 'es' });

    expect(mockTypeOrmRepo.findAndCount).toHaveBeenCalledWith({
      where: { country: 'ES' },
      order: { createdAt: 'DESC' },
    });
  });

  it('should combine text search and country filter in where conditions', async () => {
    (mockTypeOrmRepo.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

    await adapter.search({ term: 'Roams', country: 'es' });

    expect(mockTypeOrmRepo.findAndCount).toHaveBeenCalledWith({
      where: [
        { companyName: expect.anything(), country: 'ES' },
        { taxId: expect.anything(), country: 'ES' },
        { email: expect.anything(), country: 'ES' },
      ],
      order: { createdAt: 'DESC' },
    });
  });

  it('should ignore country filter when country is ALL', async () => {
    (mockTypeOrmRepo.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

    await adapter.search({ country: 'ALL' });

    expect(mockTypeOrmRepo.findAndCount).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
  });

  it('should apply pagination options with skip and take', async () => {
    (mockTypeOrmRepo.findAndCount as jest.Mock).mockResolvedValue([[], 50]);

    const result = await adapter.search({ page: 3, limit: 10 });

    expect(result.total).toBe(50);
    expect(mockTypeOrmRepo.findAndCount).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
      skip: 20,
      take: 10,
    });
  });

  it('should accept CustomerSearchCriteria object parameter with sorting and pagination', async () => {
    (mockTypeOrmRepo.findAndCount as jest.Mock).mockResolvedValue([[], 50]);

    const result = await adapter.search({
      term: 'Acme',
      country: 'ES',
      page: 2,
      limit: 10,
      sortBy: 'companyName',
      sortOrder: 'ASC',
    });

    expect(result.total).toBe(50);
    expect(mockTypeOrmRepo.findAndCount).toHaveBeenCalledWith({
      where: [
        { companyName: expect.anything(), country: 'ES' },
        { taxId: expect.anything(), country: 'ES' },
        { email: expect.anything(), country: 'ES' },
      ],
      order: { companyName: 'ASC' },
      skip: 10,
      take: 10,
    });
  });
});
