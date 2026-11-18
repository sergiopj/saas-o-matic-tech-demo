import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindManyOptions, FindOptionsWhere } from 'typeorm';
import type {
  CustomerRepositoryPort,
  PaginatedResult,
  CustomerSortField,
  SortOrderDirection,
  CustomerSearchCriteria,
} from '../../../../application/ports/out/customer-repository.port';
import { Customer } from '../../../../domain/entities/customer.entity';
import { normalizeTaxId } from '../../../../domain/value-objects/tax-id.vo';
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

    const hasTerm = Boolean(criteria.term && criteria.term.trim());
    const normalizedCountry =
      criteria.country &&
      criteria.country.trim() &&
      criteria.country.trim().toUpperCase() !== 'ALL'
        ? criteria.country.trim().toUpperCase()
        : undefined;

    let where:
      | FindOptionsWhere<CustomerTypeOrmEntity>
      | FindOptionsWhere<CustomerTypeOrmEntity>[]
      | undefined;

    if (!hasTerm && !normalizedCountry) {
      where = undefined;
    } else if (!hasTerm && normalizedCountry) {
      where = { country: normalizedCountry };
    } else {
      const cleanTerm = `%${criteria.term!.trim()}%`;
      const normalizedTaxTerm = `%${normalizeTaxId(criteria.term!)}%`;
      where = normalizedCountry
        ? [
            { companyName: Like(cleanTerm), country: normalizedCountry },
            { taxId: Like(normalizedTaxTerm), country: normalizedCountry },
            { email: Like(cleanTerm), country: normalizedCountry },
          ]
        : [
            { companyName: Like(cleanTerm) },
            { taxId: Like(normalizedTaxTerm) },
            { email: Like(cleanTerm) },
          ];
    }

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
    const activeOrder: 'ASC' | 'DESC' =
      criteria.sortOrder &&
      (criteria.sortOrder.toUpperCase() === 'ASC' ||
        criteria.sortOrder.toUpperCase() === 'DESC')
        ? (criteria.sortOrder.toUpperCase() as 'ASC' | 'DESC')
        : activeSortField === 'companyName'
          ? 'ASC'
          : 'DESC';

    const options: FindManyOptions<CustomerTypeOrmEntity> = {
      order: { [activeSortField]: activeOrder },
    };

    if (where) {
      options.where = where;
    }

    if (
      criteria.page &&
      criteria.limit &&
      criteria.page > 0 &&
      criteria.limit > 0
    ) {
      options.skip = (criteria.page - 1) * criteria.limit;
      options.take = criteria.limit;
    }

    const [entities, total] = await this.repository.findAndCount(options);

    return {
      items: entities.map((entity) =>
        CustomerPersistenceMapper.toDomain(entity),
      ),
      total,
    };
  }
}
