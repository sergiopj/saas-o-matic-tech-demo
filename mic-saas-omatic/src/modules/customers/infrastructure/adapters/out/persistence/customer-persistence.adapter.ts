import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import type { CustomerRepositoryPort } from '../../../../application/ports/out/customer-repository.port';
import { Customer } from '../../../../domain/entities/customer.entity';
import { normalizeTaxId } from '../../../../domain/value-objects/tax-id.vo';
import { CustomerTypeOrmEntity } from './customer.typeorm-entity';
import { CustomerPersistenceMapper } from './customer-persistence.mapper';

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

  async search(term?: string): Promise<Customer[]> {
    if (!term || !term.trim()) {
      const all = await this.repository.find({ order: { createdAt: 'DESC' } });
      return all.map(CustomerPersistenceMapper.toDomain);
    }

    const cleanTerm = `%${term.trim()}%`;
    const normalizedTaxTerm = `%${normalizeTaxId(term)}%`;

    const found = await this.repository.find({
      where: [
        { companyName: Like(cleanTerm) },
        { taxId: Like(normalizedTaxTerm) },
        { email: Like(cleanTerm) },
      ],
      order: { createdAt: 'DESC' },
    });

    return found.map(CustomerPersistenceMapper.toDomain);
  }
}

