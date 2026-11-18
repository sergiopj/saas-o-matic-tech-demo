import { Customer } from '../../../../../domain/entities/customer.entity';
import { CustomerDetailResponseDto, SimulationSummaryDto } from './customer-detail-response.dto';

describe('CustomerDetailResponseDto', () => {
  const sampleCustomer = Customer.reconstitute({
    id: 'cust-123',
    companyName: 'Acme Global',
    taxId: 'B12345674',
    email: 'contact@acme.com',
    country: 'ES',
    selectedPlan: 'Enterprise',
    createdAt: new Date('2026-01-15T12:00:00.000Z'),
  });

  it('should map from domain customer with empty simulations by default', () => {
    const dto = CustomerDetailResponseDto.fromDomain(sampleCustomer);

    expect(dto.id).toBe('cust-123');
    expect(dto.companyName).toBe('Acme Global');
    expect(dto.taxId).toBe('B12345674');
    expect(dto.email).toBe('contact@acme.com');
    expect(dto.country).toBe('ES');
    expect(dto.selectedPlan).toBe('Enterprise');
    expect(dto.createdAt).toBe('2026-01-15T12:00:00.000Z');
    expect(dto.simulations).toEqual([]);
  });

  it('should map from domain customer with provided simulation summaries', () => {
    const simulations: SimulationSummaryDto[] = [
      {
        id: 'sim-1',
        customerId: 'cust-123',
        activeUsers: 50,
        storageGb: 200,
        apiCalls: 50000,
        monthlyBaseCost: 100,
        taxRate: 0.21,
        taxAmount: 21,
        totalCost: 121,
        currency: 'EUR',
        createdAt: '2026-01-15T12:30:00.000Z',
      },
    ];

    const dto = CustomerDetailResponseDto.fromDomain(sampleCustomer, simulations);

    expect(dto.simulations).toHaveLength(1);
    expect(dto.simulations[0].id).toBe('sim-1');
  });
});
