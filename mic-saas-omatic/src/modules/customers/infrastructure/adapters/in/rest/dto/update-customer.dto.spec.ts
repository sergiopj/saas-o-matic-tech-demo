import { validate } from 'class-validator';
import { UpdateCustomerDto } from './update-customer.dto';

describe('UpdateCustomerDto (Validation Layer)', () => {
  it('should validate successfully when empty (all optional)', async () => {
    const dto = new UpdateCustomerDto();
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate successfully with partial valid data', async () => {
    const dto = new UpdateCustomerDto();
    dto.companyName = 'New Corporate Name';
    dto.email = 'updated@company.com';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid email format when email is provided', async () => {
    const dto = new UpdateCustomerDto();
    dto.email = 'not-an-email';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('email');
  });

  it('should reject country if it is not 2 letters', async () => {
    const dto = new UpdateCustomerDto();
    dto.country = 'ESP';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'country')).toBe(true);
  });

  it('should reject companyName if shorter than 2 characters', async () => {
    const dto = new UpdateCustomerDto();
    dto.companyName = 'A';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('companyName');
  });
});
