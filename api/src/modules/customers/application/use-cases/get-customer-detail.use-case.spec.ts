import { GetCustomerDetailUseCase } from './get-customer-detail.use-case';
import type { CustomerRepositoryPort } from '../ports/out/customer-repository.port';
import { Customer } from '../../domain/entities/customer.entity';
import { EntityNotFoundError } from '../../../../shared/domain/domain.exception';

describe('GetCustomerDetailUseCase', () => {
  let useCase: GetCustomerDetailUseCase;
  let mockRepository: jest.Mocked<CustomerRepositoryPort>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByTaxId: jest.fn(),
      search: jest.fn(),
    };
    useCase = new GetCustomerDetailUseCase(mockRepository);
  });

  it('should return the customer when found by id', async () => {
    const customer = Customer.reconstitute({
      id: 'cust-123',
      companyName: 'Roams Corp',
      taxId: 'B12345674',
      email: 'info@roams.es',
      country: 'ES',
      selectedPlan: 'Enterprise',
      createdAt: new Date(),
    });
    mockRepository.findById.mockResolvedValue(customer);

    const result = await useCase.execute('cust-123');

    expect(result.getId()).toBe('cust-123');
    expect(result.getCompanyName()).toBe('Roams Corp');
  });

  it('should throw EntityNotFoundError when customer does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('non-existent-id')).rejects.toThrow(
      EntityNotFoundError,
    );
  });
});
