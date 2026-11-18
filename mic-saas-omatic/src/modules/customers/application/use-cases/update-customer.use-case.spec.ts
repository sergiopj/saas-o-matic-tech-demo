import { UpdateCustomerUseCase } from './update-customer.use-case';
import type { CustomerRepositoryPort } from '../ports/out/customer-repository.port';
import { Customer } from '../../domain/entities/customer.entity';
import {
  ConflictError,
  EntityNotFoundError,
} from '../../../../shared/domain/domain.exception';

describe('UpdateCustomerUseCase', () => {
  let useCase: UpdateCustomerUseCase;
  let mockRepository: jest.Mocked<CustomerRepositoryPort>;

  const existingCustomer = Customer.reconstitute({
    id: 'cust-100',
    companyName: 'Acme Corp',
    taxId: 'B12345674',
    email: 'contact@acme.com',
    country: 'ES',
    selectedPlan: 'Pro',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  });

  beforeEach(() => {
    mockRepository = {
      save: jest.fn().mockImplementation((c: Customer) => Promise.resolve(c)),
      findById: jest.fn(),
      findByTaxId: jest.fn(),
      search: jest.fn(),
    };
    useCase = new UpdateCustomerUseCase(mockRepository);
  });

  it('should update customer details when customer exists', async () => {
    mockRepository.findById.mockResolvedValue(existingCustomer);

    const result = await useCase.execute('cust-100', {
      companyName: 'Acme International',
      email: 'new-billing@acme.com',
      selectedPlan: 'Enterprise Scale',
    });

    expect(result.getCompanyName()).toBe('Acme International');
    expect(result.getEmail()).toBe('new-billing@acme.com');
    expect(result.getSelectedPlan()).toBe('Enterprise Scale');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should throw EntityNotFoundError when customer does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute('unknown-id', { companyName: 'Name' }),
    ).rejects.toThrow(EntityNotFoundError);

    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should throw ConflictError when updated taxId belongs to another customer', async () => {
    mockRepository.findById.mockResolvedValue(existingCustomer);
    const otherCustomer = Customer.reconstitute({
      id: 'cust-200',
      companyName: 'Other Corp',
      taxId: 'A12345674',
      email: 'other@corp.es',
      country: 'ES',
      selectedPlan: 'Startup',
      createdAt: new Date(),
    });
    mockRepository.findByTaxId.mockResolvedValue(otherCustomer);

    await expect(
      useCase.execute('cust-100', { taxId: 'A-12345674' }),
    ).rejects.toThrow(ConflictError);

    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should allow updating if taxId is unchanged or belongs to the same customer', async () => {
    mockRepository.findById.mockResolvedValue(existingCustomer);
    mockRepository.findByTaxId.mockResolvedValue(existingCustomer);

    const result = await useCase.execute('cust-100', {
      taxId: 'B-12345674', // same normalized taxId
      companyName: 'Acme Renamed',
    });

    expect(result.getCompanyName()).toBe('Acme Renamed');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should allow updating taxId when new taxId does not belong to any customer', async () => {
    mockRepository.findById.mockResolvedValue(existingCustomer);
    mockRepository.findByTaxId.mockResolvedValue(null);

    const result = await useCase.execute('cust-100', {
      taxId: 'DE999888777',
      country: 'DE',
    });

    expect(result.getTaxId()).toBe('DE999888777');
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });
});
