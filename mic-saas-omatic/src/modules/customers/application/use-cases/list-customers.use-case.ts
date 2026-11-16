import { Inject, Injectable } from '@nestjs/common';
import { CUSTOMER_REPOSITORY_PORT } from '../ports/out/customer-repository.port';
import type {
  CustomerRepositoryPort,
  PaginatedResult,
  CustomerSortField,
  SortOrderDirection,
} from '../ports/out/customer-repository.port';
import type { Customer } from '../../domain/entities/customer.entity';

@Injectable()
export class ListCustomersUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY_PORT)
    private readonly customerRepository: CustomerRepositoryPort,
  ) {}

  async execute(
    searchTerm?: string,
    country?: string,
    page?: number,
    limit?: number,
    sortBy?: CustomerSortField,
    sortOrder?: SortOrderDirection,
  ): Promise<PaginatedResult<Customer>> {
    return this.customerRepository.search(
      searchTerm,
      country,
      page,
      limit,
      sortBy,
      sortOrder,
    );
  }
}
