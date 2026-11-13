import { validate } from 'class-validator';
import { CreateCustomerDto } from './create-customer.dto';

describe('CreateCustomerDto (Validation Layer)', () => {
  it('should validate successfully with valid data', async () => {
    const dto = new CreateCustomerDto();
    dto.companyName = 'Roams Telecom S.L.';
    dto.taxId = 'B12345674';
    dto.email = 'facturacion@roams.es';
    dto.country = 'ES';
    dto.selectedPlan = 'Growth';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid email format', async () => {
    const dto = new CreateCustomerDto();
    dto.companyName = 'Roams Telecom S.L.';
    dto.taxId = 'B12345674';
    dto.email = 'not-an-email';
    dto.country = 'ES';
    dto.selectedPlan = 'Growth';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should reject country if it is not 2 letters', async () => {
    const dto = new CreateCustomerDto();
    dto.companyName = 'Roams Telecom S.L.';
    dto.taxId = 'B12345674';
    dto.email = 'facturacion@roams.es';
    dto.country = 'ESP'; // 3 letters
    dto.selectedPlan = 'Growth';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'country')).toBe(true);
  });

  it('should reject companyName if shorter than 2 characters', async () => {
    const dto = new CreateCustomerDto();
    dto.companyName = 'A';
    dto.taxId = 'B12345674';
    dto.email = 'facturacion@roams.es';
    dto.country = 'ES';
    dto.selectedPlan = 'Growth';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('companyName');
  });
});
