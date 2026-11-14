import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import type { CustomerRepositoryPort } from '../../../../application/ports/out/customer-repository.port';
import { Customer } from '../../../../domain/entities/customer.entity';
import { normalizeTaxId } from '../../../../domain/value-objects/tax-id.vo';
import { CustomerTypeOrmEntity } from './customer.typeorm-entity';
import { CustomerPersistenceMapper } from './customer-persistence.mapper';

/**
 * Secondary persistence adapter implementing CustomerRepositoryPort using TypeORM and SQLite.
 * Fully supports multi-parameter server-side searching by company, taxId, email, and fiscal jurisdiction.
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

  async search(term?: string, country?: string): Promise<Customer[]> {
    const hasTerm = Boolean(term && term.trim());
    const normalizedCountry =
      country && country.trim() && country.trim().toUpperCase() !== 'ALL'
        ? country.trim().toUpperCase()
        : undefined;

    // Case 1: No term and no country filter -> return all customers
    if (!hasTerm && !normalizedCountry) {
      const all = await this.repository.find({ order: { createdAt: 'DESC' } });
      return all.map(CustomerPersistenceMapper.toDomain);
    }

    // Case 2: Only country filter -> filter strictly by fiscal jurisdiction
    if (!hasTerm && normalizedCountry) {
      const found = await this.repository.find({
        where: { country: normalizedCountry },
        order: { createdAt: 'DESC' },
      });
      return found.map(CustomerPersistenceMapper.toDomain);
    }

    // Case 3: Search term present (optionally combined with country)
    const cleanTerm = `%${term!.trim()}%`;
    const normalizedTaxTerm = `%${normalizeTaxId(term!)}%`;

    const whereConditions = normalizedCountry
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

    const found = await this.repository.find({
      where: whereConditions,
      order: { createdAt: 'DESC' },
    });

    return found.map(CustomerPersistenceMapper.toDomain);
  }
}
