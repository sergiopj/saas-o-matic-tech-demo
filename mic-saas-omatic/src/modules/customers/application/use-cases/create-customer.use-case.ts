import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CUSTOMER_REPOSITORY_PORT } from '../ports/out/customer-repository.port';
import type { CustomerRepositoryPort } from '../ports/out/customer-repository.port';
import { Customer } from '../../domain/entities/customer.entity';
import { normalizeTaxId } from '../../domain/value-objects/tax-id.vo';
import { ConflictError } from '../../../../shared/domain/domain.exception';

export interface CreateCustomerCommand {
  companyName: string;
  taxId: string;
  email: string;
  country: string;
  selectedPlan: string;
}

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY_PORT)
    private readonly customerRepository: CustomerRepositoryPort,
  ) { }

  async execute(command: CreateCustomerCommand): Promise<Customer> {
    const normalizedTax = normalizeTaxId(command.taxId);

    const existingCustomer = await this.customerRepository.findByTaxId(normalizedTax);
    if (existingCustomer) {
      throw new ConflictError(
        `Customer with taxId '${normalizedTax}' is already registered.`,
      );
    }

    const customer = Customer.create(
      {
        companyName: command.companyName,
        taxId: command.taxId,
        email: command.email,
        country: command.country,
        selectedPlan: command.selectedPlan,
      },
      uuidv4,
    );

    return this.customerRepository.save(customer);
  }
}

