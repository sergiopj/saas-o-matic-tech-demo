import { CustomerController } from './customer.controller';
import { CreateCustomerUseCase } from '../../../../application/use-cases/create-customer.use-case';
import { ListCustomersUseCase } from '../../../../application/use-cases/list-customers.use-case';
import { GetCustomerDetailUseCase } from '../../../../application/use-cases/get-customer-detail.use-case';
import { UpdateCustomerUseCase } from '../../../../application/use-cases/update-customer.use-case';
import { Customer } from '../../../../domain/entities/customer.entity';

describe('CustomerController (Primary Adapter)', () => {
  let controller: CustomerController;
  let mockCreateCustomerUseCase: jest.Mocked<Partial<CreateCustomerUseCase>>;
  let mockListCustomersUseCase: jest.Mocked<Partial<ListCustomersUseCase>>;
  let mockGetCustomerDetailUseCase: jest.Mocked<Partial<GetCustomerDetailUseCase>>;
  let mockUpdateCustomerUseCase: jest.Mocked<Partial<UpdateCustomerUseCase>>;

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
      execute: jest.fn().mockResolvedValue({ items: [sampleCustomer], total: 1 }),
    };
    mockGetCustomerDetailUseCase = {
      execute: jest.fn().mockResolvedValue(sampleCustomer),
    };
    mockUpdateCustomerUseCase = {
      execute: jest.fn().mockResolvedValue(sampleCustomer),
    };

    controller = new CustomerController(
      mockCreateCustomerUseCase as CreateCustomerUseCase,
      mockListCustomersUseCase as ListCustomersUseCase,
      mockGetCustomerDetailUseCase as GetCustomerDetailUseCase,
      mockUpdateCustomerUseCase as UpdateCustomerUseCase,
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

  it('should list customers by search term and country, returning CustomerResponseDto array', async () => {
    const result = await controller.list({ search: 'roams', country: 'ES' });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('uuid-100');
    expect(mockListCustomersUseCase.execute).toHaveBeenCalledWith({
      term: 'roams',
      country: 'ES',
      page: undefined,
      limit: undefined,
      sortBy: undefined,
      sortOrder: undefined,
    });
  });

  it('should support pagination and set response headers when res is provided', async () => {
    const mockRes = {
      setHeader: jest.fn(),
    } as any;

    const result = await controller.list(
      { page: 2, limit: 10 },
      mockRes,
    );

    expect(result).toHaveLength(1);
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Total-Count', '1');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Page', '2');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Limit', '10');
    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Total-Pages', '1');
  });

  it('should set total count header when res is provided without page and limit', async () => {
    const mockRes = {
      setHeader: jest.fn(),
    } as any;

    await controller.list({}, mockRes);

    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Total-Count', '1');
    expect(mockRes.setHeader).not.toHaveBeenCalledWith('X-Page', expect.anything());
    expect(mockRes.setHeader).not.toHaveBeenCalledWith('X-Limit', expect.anything());
  });

  it('should pass validated sortBy and order parameters to use case', async () => {
    await controller.list({
      page: 1,
      limit: 10,
      sortBy: 'companyName',
      order: 'ASC',
    });

    expect(mockListCustomersUseCase.execute).toHaveBeenCalledWith({
      term: undefined,
      country: undefined,
      page: 1,
      limit: 10,
      sortBy: 'companyName',
      sortOrder: 'ASC',
    });
  });

  it('should return lightweight CustomerLiteResponseDto array when fields=lite is requested', async () => {
    const result = await controller.list({ fields: 'lite' });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'uuid-100',
      companyName: 'Roams Corp',
      country: 'ES',
    });
    expect((result[0] as any).taxId).toBeUndefined();
    expect((result[0] as any).email).toBeUndefined();
  });

  it('should get customer detail by id as flat CustomerResponseDto', async () => {
    const result = await controller.getById('uuid-100');

    expect(result.id).toBe('uuid-100');
    expect(mockGetCustomerDetailUseCase.execute).toHaveBeenCalledWith('uuid-100');
  });

  it('should update customer and return updated CustomerResponseDto', async () => {
    const updatedCustomer = Customer.reconstitute({
      id: 'uuid-100',
      companyName: 'Roams Updated Corp',
      taxId: 'B12345674',
      email: 'new-billing@roams.es',
      country: 'ES',
      selectedPlan: 'Enterprise Unlimited',
      createdAt: new Date('2026-05-10T10:00:00.000Z'),
    });
    mockUpdateCustomerUseCase.execute = jest.fn().mockResolvedValue(updatedCustomer);

    const result = await controller.update('uuid-100', {
      companyName: 'Roams Updated Corp',
      email: 'new-billing@roams.es',
      selectedPlan: 'Enterprise Unlimited',
    });

    expect(result.id).toBe('uuid-100');
    expect(result.companyName).toBe('Roams Updated Corp');
    expect(result.email).toBe('new-billing@roams.es');
    expect(mockUpdateCustomerUseCase.execute).toHaveBeenCalledWith('uuid-100', {
      companyName: 'Roams Updated Corp',
      email: 'new-billing@roams.es',
      selectedPlan: 'Enterprise Unlimited',
    });
  });
});
