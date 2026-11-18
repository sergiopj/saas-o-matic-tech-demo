import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ListCustomersQueryDto } from './list-customers-query.dto';

describe('ListCustomersQueryDto (Validation & Transformation Layer)', () => {
  it('should validate an empty query with zero errors', async () => {
    const dto = plainToInstance(ListCustomersQueryDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should transform string page and limit to numbers and pass validation', async () => {
    const dto = plainToInstance(ListCustomersQueryDto, {
      page: '2',
      limit: '15',
      sortBy: 'companyName',
      order: 'asc',
      fields: 'lite',
    });

    expect(typeof dto.page).toBe('number');
    expect(dto.page).toBe(2);
    expect(typeof dto.limit).toBe('number');
    expect(dto.limit).toBe(15);
    expect(dto.order).toBe('ASC');

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid page numbers (zero, negative, or non-numeric strings)', async () => {
    const invalidZero = plainToInstance(ListCustomersQueryDto, { page: '0' });
    const errorsZero = await validate(invalidZero);
    expect(errorsZero.some((e) => e.property === 'page')).toBe(true);

    const invalidNegative = plainToInstance(ListCustomersQueryDto, { page: '-5' });
    const errorsNegative = await validate(invalidNegative);
    expect(errorsNegative.some((e) => e.property === 'page')).toBe(true);

    const invalidString = plainToInstance(ListCustomersQueryDto, { page: 'abc' });
    const errorsString = await validate(invalidString);
    expect(errorsString.some((e) => e.property === 'page')).toBe(true);
  });

  it('should reject limit greater than 100 or less than 1', async () => {
    const tooHigh = plainToInstance(ListCustomersQueryDto, { limit: '101' });
    const errorsHigh = await validate(tooHigh);
    expect(errorsHigh.some((e) => e.property === 'limit')).toBe(true);

    const tooLow = plainToInstance(ListCustomersQueryDto, { limit: '0' });
    const errorsLow = await validate(tooLow);
    expect(errorsLow.some((e) => e.property === 'limit')).toBe(true);
  });

  it('should reject invalid sortBy fields', async () => {
    const dto = plainToInstance(ListCustomersQueryDto, { sortBy: 'passwordHash' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'sortBy')).toBe(true);
  });

  it('should reject invalid sort orders', async () => {
    const dto = plainToInstance(ListCustomersQueryDto, { order: 'SIDEWAYS' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'order')).toBe(true);
  });
});
