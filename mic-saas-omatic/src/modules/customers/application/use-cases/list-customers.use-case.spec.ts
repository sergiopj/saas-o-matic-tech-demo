import { ListCustomersUseCase } from './list-customers.use-case';
import type { CustomerRepositoryPort } from '../ports/out/customer-repository.port';
import { Customer } from '../../domain/entities/customer.entity';

describe('ListCustomersUseCase', () => {
  let useCase: ListCustomersUseCase;
  let mockRepository: jest.Mocked<CustomerRepositoryPort>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByTaxId: jest.fn(),
      search: jest.fn(),
    };
    useCase = new ListCustomersUseCase(mockRepository);
  });

  it('should return all customers when no search term is passed', async () => {
    const customer = Customer.reconstitute({
      id: 'cust-1',
      companyName: 'Roams Corp',
      taxId: 'B12345674',
      email: 'billing@roams.es',
      country: 'ES',
      selectedPlan: 'Pro',
      createdAt: new Date(),
    });
    mockRepository.search.mockResolvedValue({ items: [customer], total: 1 });

    const result = await useCase.execute();

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.items[0].getCompanyName()).toBe('Roams Corp');
    expect(mockRepository.search).toHaveBeenCalledWith({});
  });

  it('should forward search filter, country filter, pagination and sorting criteria to repository', async () => {
    mockRepository.search.mockResolvedValue({ items: [], total: 0 });

    const criteria = {
      term: 'telecom',
      country: 'ES',
      page: 2,
      limit: 10,
      sortBy: 'companyName' as const,
      sortOrder: 'ASC' as const,
    };

    await useCase.execute(criteria);

    expect(mockRepository.search).toHaveBeenCalledWith(criteria);
  });

  it('should accept CustomerSearchCriteria parameter object directly', async () => {
    mockRepository.search.mockResolvedValue({ items: [], total: 0 });

    const criteria = {
      term: 'cloud',
      country: 'DE',
      page: 1,
      limit: 8,
      sortBy: 'createdAt' as const,
      sortOrder: 'DESC' as const,
    };

    await useCase.execute(criteria);

    expect(mockRepository.search).toHaveBeenCalledWith(criteria);
  });
});
