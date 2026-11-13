export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EntityNotFoundError extends DomainError {
  constructor(entityName: string, id: string) {
    super(`${entityName} with id '${id}' was not found.`);
    this.name = 'EntityNotFoundError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}
