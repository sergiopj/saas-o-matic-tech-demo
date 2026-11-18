import { Inject, Injectable } from '@nestjs/common';
import { CUSTOMER_REPOSITORY_PORT } from '../ports/out/customer-repository.port';
import type {
  CustomerRepositoryPort,
  PaginatedResult,
  CustomerSortField,
  SortOrderDirection,
  CustomerSearchCriteria,
} from '../ports/out/customer-repository.port';
import type { Customer } from '../../domain/entities/customer.entity';

@Injectable()
export class ListCustomersUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY_PORT)
    private readonly customerRepository: CustomerRepositoryPort,
  ) {}

  /**
   * Dispatches customer search queries.
   * Supports both parameter object (CustomerSearchCriteria) and positional arguments.
   */
  async execute(
    criteriaOrTerm?: CustomerSearchCriteria | string,
    country?: string,
    page?: number,
    limit?: number,
    sortBy?: CustomerSortField,
    sortOrder?: SortOrderDirection,
  ): Promise<PaginatedResult<Customer>> {
    const criteria: CustomerSearchCriteria =
      typeof criteriaOrTerm === 'object' && criteriaOrTerm !== null
        ? criteriaOrTerm
        : {
            term: criteriaOrTerm,
            country,
            page,
            limit,
            sortBy,
            sortOrder,
          };

    return this.customerRepository.search(criteria);
  }
}
