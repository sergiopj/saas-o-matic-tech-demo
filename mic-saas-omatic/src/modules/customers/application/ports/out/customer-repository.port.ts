import { Customer } from '../../../domain/entities/customer.entity';

export const CUSTOMER_REPOSITORY_PORT = Symbol('CUSTOMER_REPOSITORY_PORT');

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export type CustomerSortField = 'companyName' | 'createdAt' | 'country' | 'taxId';
export type SortOrderDirection = 'ASC' | 'DESC';

export interface CustomerRepositoryPort {
  save(customer: Customer): Promise<Customer>;
  findById(id: string): Promise<Customer | null>;
  findByTaxId(taxId: string): Promise<Customer | null>;
  search(
    term?: string,
    country?: string,
    page?: number,
    limit?: number,
    sortBy?: CustomerSortField,
    sortOrder?: SortOrderDirection,
  ): Promise<PaginatedResult<Customer>>;
}
