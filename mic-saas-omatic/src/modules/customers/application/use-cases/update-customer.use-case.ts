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
import { normalizeTaxId } from '../../domain/services/spanish-fiscal.validator';

@Injectable()
export class UpdateCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY_PORT)
    private readonly customerRepository: CustomerRepositoryPort,
  ) {}

  async execute(id: string, payload: UpdateCustomerPayload): Promise<Customer> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new EntityNotFoundError('Customer', id);
    }

    if (payload.taxId) {
      await this.ensureUniqueTaxId(payload.taxId, customer);
    }

    const updated = customer.update(payload);
    return this.customerRepository.save(updated);
  }

  private async ensureUniqueTaxId(
    newTaxId: string,
    currentCustomer: Customer,
  ): Promise<void> {
    const normalizedTax = normalizeTaxId(newTaxId);
    if (normalizedTax === currentCustomer.getTaxId()) {
      return;
    }

    const duplicate = await this.customerRepository.findByTaxId(normalizedTax);
    if (duplicate && duplicate.getId() !== currentCustomer.getId()) {
      throw new ConflictError(
        `A customer with taxId '${normalizedTax}' already exists.`,
      );
    }
  }
}
