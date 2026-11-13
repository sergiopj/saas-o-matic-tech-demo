import { Customer } from './customer.entity';
import { DomainError } from '../../../../shared/domain/domain.exception';

describe('Customer Domain Entity (Pure TypeScript)', () => {
  const fakeId = '550e8400-e29b-41d4-a716-446655440000';
  const mockIdGenerator = () => fakeId;

  it('should successfully create a valid Customer with normalized taxId and email', () => {
    const customer = Customer.create(
      {
        companyName: '  Roams Telecom S.L.  ',
        taxId: '  b - 12345674  ',
        email: '  Billing@Roams.ES  ',
        country: 'es',
        selectedPlan: '  Enterprise  ',
      },
      mockIdGenerator,
    );

    expect(customer.getId()).toBe(fakeId);
    expect(customer.getCompanyName()).toBe('Roams Telecom S.L.');
    expect(customer.getTaxId()).toBe('B12345674');
    expect(customer.getEmail()).toBe('billing@roams.es');
    expect(customer.getCountry()).toBe('ES');
    expect(customer.getSelectedPlan()).toBe('Enterprise');
    expect(customer.getCreatedAt()).toBeInstanceOf(Date);
  });

  it('should throw DomainError if company name is too short', () => {
    expect(() =>
      Customer.create(
        {
          companyName: 'A',
          taxId: 'B12345674',
          email: 'test@acme.es',
          country: 'ES',
          selectedPlan: 'Pro',
        },
        mockIdGenerator,
      ),
    ).toThrow(DomainError);
  });

  it('should throw DomainError if country code is not 2 letters', () => {
    expect(() =>
      Customer.create(
        {
          companyName: 'Acme Corp',
          taxId: 'B12345674',
          email: 'test@acme.es',
          country: 'ESP',
          selectedPlan: 'Pro',
        },
        mockIdGenerator,
      ),
    ).toThrow(DomainError);
  });

  it('should throw DomainError if taxId is invalid for the specified country', () => {
    expect(() =>
      Customer.create(
        {
          companyName: 'Acme Corp',
          taxId: 'B12345678',
          email: 'test@acme.es',
          country: 'ES',
          selectedPlan: 'Pro',
        },
        mockIdGenerator,
      ),
    ).toThrow(DomainError);
  });

  it('should throw DomainError if email format is invalid', () => {
    expect(() =>
      Customer.create(
        {
          companyName: 'Acme Corp',
          taxId: 'B12345674',
          email: 'invalid-email-format',
          country: 'ES',
          selectedPlan: 'Pro',
        },
        mockIdGenerator,
      ),
    ).toThrow(DomainError);
  });

  it('should reconstitute an existing customer correctly from persistence', () => {
    const pastDate = new Date('2026-01-01T00:00:00.000Z');
    const customer = Customer.reconstitute({
      id: fakeId,
      companyName: 'Historical Corp',
      taxId: 'B12345674',
      email: 'history@corp.es',
      country: 'ES',
      selectedPlan: 'Startup',
      createdAt: pastDate,
    });

    expect(customer.getId()).toBe(fakeId);
    expect(customer.getCreatedAt()).toBe(pastDate);
  });
});
