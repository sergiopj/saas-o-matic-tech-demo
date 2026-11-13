import { validate } from 'class-validator';
import { CreateSimulationDto } from './create-simulation.dto';

describe('CreateSimulationDto (Validation Layer)', () => {
  it('should validate successfully with valid data', async () => {
    const dto = new CreateSimulationDto();
    dto.customerId = '550e8400-e29b-41d4-a716-446655440000';
    dto.activeUsers = 15;
    dto.storageGb = 100.5;
    dto.apiCalls = 25000;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept 0 as valid boundary for activeUsers, storageGb and apiCalls', async () => {
    const dto = new CreateSimulationDto();
    dto.customerId = '550e8400-e29b-41d4-a716-446655440000';
    dto.activeUsers = 0;
    dto.storageGb = 0;
    dto.apiCalls = 0;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject invalid customerId when not a UUID v4', async () => {
    const dto = new CreateSimulationDto();
    dto.customerId = 'not-a-valid-uuid';
    dto.activeUsers = 10;
    dto.storageGb = 10;
    dto.apiCalls = 1000;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'customerId')).toBe(true);
  });

  it('should reject negative activeUsers', async () => {
    const dto = new CreateSimulationDto();
    dto.customerId = '550e8400-e29b-41d4-a716-446655440000';
    dto.activeUsers = -1;
    dto.storageGb = 10;
    dto.apiCalls = 1000;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'activeUsers')).toBe(true);
  });

  it('should reject decimal activeUsers', async () => {
    const dto = new CreateSimulationDto();
    dto.customerId = '550e8400-e29b-41d4-a716-446655440000';
    dto.activeUsers = 10.5;
    dto.storageGb = 10;
    dto.apiCalls = 1000;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'activeUsers')).toBe(true);
  });

  it('should reject negative storageGb', async () => {
    const dto = new CreateSimulationDto();
    dto.customerId = '550e8400-e29b-41d4-a716-446655440000';
    dto.activeUsers = 10;
    dto.storageGb = -5;
    dto.apiCalls = 1000;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'storageGb')).toBe(true);
  });

  it('should reject negative apiCalls', async () => {
    const dto = new CreateSimulationDto();
    dto.customerId = '550e8400-e29b-41d4-a716-446655440000';
    dto.activeUsers = 10;
    dto.storageGb = 10;
    dto.apiCalls = -100;

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'apiCalls')).toBe(true);
  });
});
