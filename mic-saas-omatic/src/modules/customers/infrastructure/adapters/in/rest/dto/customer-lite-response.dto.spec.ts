import { Customer } from '../../../../../domain/entities/customer.entity';
import { CustomerLiteResponseDto } from './customer-lite-response.dto';

describe('CustomerLiteResponseDto (Sparse Fieldset / Read-Model Projection)', () => {
  it('should project only essential identity attributes and omit heavy fields', () => {
    const customer = Customer.reconstitute({
      id: 'cust-uuid-123',
      companyName: 'Acme Corp S.L.',
      taxId: 'B12345674',
      email: 'billing@acme.com',
      country: 'ES',
      selectedPlan: 'Enterprise Scale',
      createdAt: new Date('2026-01-15T10:00:00.000Z'),
    });

    const liteDto = CustomerLiteResponseDto.fromDomain(customer);

    expect(liteDto).toEqual({
      id: 'cust-uuid-123',
      companyName: 'Acme Corp S.L.',
      country: 'ES',
    });

    // Assert that heavy/confidential fields are not projected in the lite DTO
    expect((liteDto as Record<string, unknown>)['taxId']).toBeUndefined();
    expect((liteDto as Record<string, unknown>)['email']).toBeUndefined();
    expect((liteDto as Record<string, unknown>)['selectedPlan']).toBeUndefined();
    expect((liteDto as Record<string, unknown>)['createdAt']).toBeUndefined();
  });
});
