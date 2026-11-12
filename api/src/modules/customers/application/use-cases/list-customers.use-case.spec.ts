import { ListCustomersUseCase } from './list-customers.use-case';
import { CustomerRepositoryPort } from '../ports/out/customer-repository.port';
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
    mockRepository.search.mockResolvedValue([customer]);

    const result = await useCase.execute();

    expect(result).toHaveLength(1);
    expect(result[0].getCompanyName()).toBe('Roams Corp');
    expect(mockRepository.search).toHaveBeenCalledWith(undefined);
  });

  it('should pass search filter to the repository', async () => {
    mockRepository.search.mockResolvedValue([]);

    await useCase.execute('telecom');

    expect(mockRepository.search).toHaveBeenCalledWith('telecom');
  });
});
