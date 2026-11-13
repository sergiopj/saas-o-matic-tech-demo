import { CustomerController } from './customer.controller';
import { CreateCustomerUseCase } from '../../../../application/use-cases/create-customer.use-case';
import { ListCustomersUseCase } from '../../../../application/use-cases/list-customers.use-case';
import { GetCustomerDetailUseCase } from '../../../../application/use-cases/get-customer-detail.use-case';
import { Customer } from '../../../../domain/entities/customer.entity';

describe('CustomerController (Primary Adapter)', () => {
  let controller: CustomerController;
  let mockCreateCustomerUseCase: jest.Mocked<Partial<CreateCustomerUseCase>>;
  let mockListCustomersUseCase: jest.Mocked<Partial<ListCustomersUseCase>>;
  let mockGetCustomerDetailUseCase: jest.Mocked<Partial<GetCustomerDetailUseCase>>;

  const sampleCustomer = Customer.reconstitute({
    id: 'uuid-100',
    companyName: 'Roams Corp',
    taxId: 'B12345674',
    email: 'billing@roams.es',
    country: 'ES',
    selectedPlan: 'Enterprise',
    createdAt: new Date('2026-05-10T10:00:00.000Z'),
  });

  beforeEach(() => {
    mockCreateCustomerUseCase = {
      execute: jest.fn().mockResolvedValue(sampleCustomer),
    };
    mockListCustomersUseCase = {
      execute: jest.fn().mockResolvedValue([sampleCustomer]),
    };
    mockGetCustomerDetailUseCase = {
      execute: jest.fn().mockResolvedValue(sampleCustomer),
    };

    controller = new CustomerController(
      mockCreateCustomerUseCase as CreateCustomerUseCase,
      mockListCustomersUseCase as ListCustomersUseCase,
      mockGetCustomerDetailUseCase as GetCustomerDetailUseCase,
    );
  });

  it('should create customer and return CustomerResponseDto', async () => {
    const result = await controller.create({
      companyName: 'Roams Corp',
      taxId: 'B12345674',
      email: 'billing@roams.es',
      country: 'ES',
      selectedPlan: 'Enterprise',
    });

    expect(result.id).toBe('uuid-100');
    expect(result.companyName).toBe('Roams Corp');
    expect(mockCreateCustomerUseCase.execute).toHaveBeenCalledTimes(1);
  });

  it('should list customers and return CustomerResponseDto array', async () => {
    const result = await controller.list('roams');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('uuid-100');
    expect(mockListCustomersUseCase.execute).toHaveBeenCalledWith('roams');
  });

  it('should get customer detail by id as flat CustomerResponseDto', async () => {
    const result = await controller.getById('uuid-100');

    expect(result.id).toBe('uuid-100');
    expect(mockGetCustomerDetailUseCase.execute).toHaveBeenCalledWith('uuid-100');
  });
});
