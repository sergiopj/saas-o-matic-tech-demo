import { CreateCustomerUseCase } from './create-customer.use-case';
import type { CustomerRepositoryPort } from '../ports/out/customer-repository.port';
import { Customer } from '../../domain/entities/customer.entity';
import { ConflictError, DomainError } from '../../../../shared/domain/domain.exception';

describe('CreateCustomerUseCase', () => {
  let useCase: CreateCustomerUseCase;
  let mockRepository: jest.Mocked<CustomerRepositoryPort>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn().mockImplementation((c: Customer) => Promise.resolve(c)),
      findById: jest.fn(),
      findByTaxId: jest.fn(),
      search: jest.fn(),
    };
    useCase = new CreateCustomerUseCase(mockRepository);
  });

  it('should create and save a new customer when taxId is unique', async () => {
    mockRepository.findByTaxId.mockResolvedValue(null);

    const result = await useCase.execute({
      companyName: 'Roams Corp',
      taxId: 'B12345674',
      email: 'contact@roams.es',
      country: 'ES',
      selectedPlan: 'Growth',
    });

    expect(result.getCompanyName()).toBe('Roams Corp');
    expect(result.getTaxId()).toBe('B12345674');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should throw ConflictError when taxId is already registered', async () => {
    const existing = Customer.reconstitute({
      id: 'existing-id',
      companyName: 'Existing Company',
      taxId: 'B12345674',
      email: 'existing@corp.es',
      country: 'ES',
      selectedPlan: 'Startup',
      createdAt: new Date(),
    });
    mockRepository.findByTaxId.mockResolvedValue(existing);

    await expect(
      useCase.execute({
        companyName: 'Duplicate Company',
        taxId: 'B-12345674',
        email: 'duplicate@corp.es',
        country: 'ES',
        selectedPlan: 'Pro',
      }),
    ).rejects.toThrow(ConflictError);

    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should throw DomainError when payload violates business invariants', async () => {
    mockRepository.findByTaxId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        companyName: 'A',
        taxId: 'B12345674',
        email: 'invalid@acme.es',
        country: 'ES',
        selectedPlan: 'Pro',
      }),
    ).rejects.toThrow(DomainError);
  });
});
