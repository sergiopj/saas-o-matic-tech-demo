import { Inject, Injectable } from '@nestjs/common';
import { CUSTOMER_REPOSITORY_PORT } from '../ports/out/customer-repository.port';
import type { CustomerRepositoryPort } from '../ports/out/customer-repository.port';
import {
  Customer,
  UpdateCustomerPayload,
} from '../../domain/entities/customer.entity';
import {
  ConflictError,
  EntityNotFoundError,
} from '../../../../shared/domain/domain.exception';
import { normalizeTaxId } from '../../domain/value-objects/tax-id.vo';

@Injectable()
export class UpdateCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY_PORT)
    private readonly customerRepository: CustomerRepositoryPort,
  ) {}

  async execute(id: string, payload: UpdateCustomerPayload): Promise<Customer> {
    const existing = await this.customerRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundError('Customer', id);
    }

    if (payload.taxId) {
      const normalizedTax = normalizeTaxId(payload.taxId);
      if (normalizedTax !== existing.getTaxId()) {
        const duplicate =
          await this.customerRepository.findByTaxId(normalizedTax);
        if (duplicate && duplicate.getId() !== id) {
          throw new ConflictError(
            `A customer with taxId '${normalizedTax}' already exists.`,
          );
        }
      }
    }

    const updated = existing.update(payload);
    return this.customerRepository.save(updated);
  }
}
