import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions, FindOptionsWhere } from 'typeorm';
import type {
  CustomerRepositoryPort,
  PaginatedResult,
  CustomerSortField,
  CustomerSearchCriteria,
} from '../../../../application/ports/out/customer-repository.port';
import { Customer } from '../../../../domain/entities/customer.entity';
import { normalizeTaxId } from '../../../../domain/services/tax-id.validator';
import { CustomerTypeOrmEntity } from './customer.typeorm-entity';
import { CustomerPersistenceMapper } from './customer-persistence.mapper';

/**
 * Secondary persistence adapter implementing CustomerRepositoryPort using TypeORM and SQLite.
 * Fully supports multi-parameter server-side searching by company, taxId, email, fiscal jurisdiction,
 * and paginated queries with total counts.
 */
@Injectable()
export class CustomerPersistenceAdapter implements CustomerRepositoryPort {
  constructor(
    @InjectRepository(CustomerTypeOrmEntity)
    private readonly repository: Repository<CustomerTypeOrmEntity>,
  ) {}

  async save(customer: Customer): Promise<Customer> {
    const typeOrmEntity = CustomerPersistenceMapper.toTypeOrm(customer);
    const saved = await this.repository.save(typeOrmEntity);
    return CustomerPersistenceMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Customer | null> {
    const found = await this.repository.findOne({ where: { id } });
    return found ? CustomerPersistenceMapper.toDomain(found) : null;
  }

  async findByTaxId(taxId: string): Promise<Customer | null> {
    const found = await this.repository.findOne({ where: { taxId } });
    return found ? CustomerPersistenceMapper.toDomain(found) : null;
  }

  async search(
    criteria: CustomerSearchCriteria = {},
  ): Promise<PaginatedResult<Customer>> {
    const options: FindManyOptions<CustomerTypeOrmEntity> = {
      order: this.buildSort(criteria),
    };

    const where = this.buildWhere(criteria);
    if (where) {
      options.where = where;
    }

    this.applyPagination(options, criteria);

    const [entities, total] = await this.repository.findAndCount(options);

    return {
      items: entities.map((entity) =>
        CustomerPersistenceMapper.toDomain(entity),
      ),
      total,
    };
  }

  private buildWhere(
    criteria: CustomerSearchCriteria,
  ):
    | FindOptionsWhere<CustomerTypeOrmEntity>
    | FindOptionsWhere<CustomerTypeOrmEntity>[]
    | undefined {
    const term = criteria.term?.trim();
    const country = this.normalizeCountry(criteria.country);

    if (!term) {
      return country ? { country } : undefined;
    }

    const cleanTerm = `%${term}%`;
    const normalizedTaxTerm = `%${normalizeTaxId(term)}%`;

    if (country) {
      return [
        { companyName: Like(cleanTerm), country },
        { taxId: Like(normalizedTaxTerm), country },
        { email: Like(cleanTerm), country },
      ];
    }

    return [
      { companyName: Like(cleanTerm) },
      { taxId: Like(normalizedTaxTerm) },
      { email: Like(cleanTerm) },
    ];
  }

  private normalizeCountry(country?: string): string | undefined {
    const normalized = country?.trim().toUpperCase();
    return normalized && normalized !== 'ALL' ? normalized : undefined;
  }

  private buildSort(
    criteria: CustomerSearchCriteria,
  ): FindManyOptions<CustomerTypeOrmEntity>['order'] {
    const fieldMap: Record<CustomerSortField, keyof CustomerTypeOrmEntity> = {
      companyName: 'companyName',
      createdAt: 'createdAt',
      country: 'country',
      taxId: 'taxId',
    };
    const activeSortField =
      criteria.sortBy && fieldMap[criteria.sortBy]
        ? fieldMap[criteria.sortBy]
        : 'createdAt';

    const requestedOrder = criteria.sortOrder?.toUpperCase();
    let activeOrder: 'ASC' | 'DESC';

    if (requestedOrder === 'ASC' || requestedOrder === 'DESC') {
      activeOrder = requestedOrder;
    } else {
      activeOrder = activeSortField === 'companyName' ? 'ASC' : 'DESC';
    }

    return { [activeSortField]: activeOrder };
  }

  private applyPagination(
    options: FindManyOptions<CustomerTypeOrmEntity>,
    criteria: CustomerSearchCriteria,
  ): void {
    if (
      criteria.page &&
      criteria.limit &&
      criteria.page > 0 &&
      criteria.limit > 0
    ) {
      options.skip = (criteria.page - 1) * criteria.limit;
      options.take = criteria.limit;
    }
  }
}
