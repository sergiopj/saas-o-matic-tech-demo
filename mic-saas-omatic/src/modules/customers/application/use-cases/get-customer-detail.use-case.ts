import { Inject, Injectable } from '@nestjs/common';
import { CUSTOMER_REPOSITORY_PORT } from '../ports/out/customer-repository.port';
import type { CustomerRepositoryPort } from '../ports/out/customer-repository.port';
import { Customer } from '../../domain/entities/customer.entity';
import { EntityNotFoundError } from '../../../../shared/domain/domain.exception';

@Injectable()
export class GetCustomerDetailUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY_PORT)
    private readonly customerRepository: CustomerRepositoryPort,
  ) {}

  async execute(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new EntityNotFoundError('Customer', id);
    }
    return customer;
  }
}
