import { Customer } from '../../../domain/entities/customer.entity';

export const CUSTOMER_REPOSITORY_PORT = Symbol('CUSTOMER_REPOSITORY_PORT');

export interface CustomerRepositoryPort {
  save(customer: Customer): Promise<Customer>;
  findById(id: string): Promise<Customer | null>;
  findByTaxId(taxId: string): Promise<Customer | null>;
  search(term?: string): Promise<Customer[]>;
}
