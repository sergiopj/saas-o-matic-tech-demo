import {
  DomainError,
  EntityNotFoundError,
  ConflictError,
} from './domain.exception';

describe('Domain Exceptions Prototype & Inheritance', () => {
  it('should maintain correct prototype chain with instanceof for EntityNotFoundError', () => {
    const error = new EntityNotFoundError('Customer', '123');

    expect(error instanceof EntityNotFoundError).toBe(true);
    expect(error instanceof DomainError).toBe(true);
    expect(error instanceof Error).toBe(true);
    expect(error.name).toBe('EntityNotFoundError');
    expect(error.message).toBe("Customer with id '123' was not found.");
  });

  it('should maintain correct prototype chain with instanceof for ConflictError', () => {
    const error = new ConflictError('TaxId already registered');

    expect(error instanceof ConflictError).toBe(true);
    expect(error instanceof DomainError).toBe(true);
    expect(error instanceof Error).toBe(true);
    expect(error.name).toBe('ConflictError');
    expect(error.message).toBe('TaxId already registered');
  });

  it('should maintain correct prototype chain for base DomainError', () => {
    const error = new DomainError('Invalid rule');

    expect(error instanceof DomainError).toBe(true);
    expect(error instanceof Error).toBe(true);
    expect(error instanceof EntityNotFoundError).toBe(false);
  });
});
