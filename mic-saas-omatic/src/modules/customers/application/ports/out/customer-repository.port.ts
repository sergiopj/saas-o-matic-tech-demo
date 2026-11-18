import type { Customer } from '../../../domain/entities/customer.entity';
import type {
  CustomerSearchCriteria,
  CustomerSortField,
  PaginatedResult,
  SortOrderDirection,
} from '../../../domain/models/customer-search-criteria.model';

export const CUSTOMER_REPOSITORY_PORT = Symbol('CUSTOMER_REPOSITORY_PORT');

export type {
  CustomerSearchCriteria,
  CustomerSortField,
  PaginatedResult,
  SortOrderDirection,
};

export interface CustomerRepositoryPort {
  save(customer: Customer): Promise<Customer>;
  findById(id: string): Promise<Customer | null>;
  findByTaxId(taxId: string): Promise<Customer | null>; 
  search(
    criteriaOrTerm?: CustomerSearchCriteria | string,
    country?: string,
    page?: number,
    limit?: number,
    sortBy?: CustomerSortField,
    sortOrder?: SortOrderDirection,
  ): Promise<PaginatedResult<Customer>>;
}
