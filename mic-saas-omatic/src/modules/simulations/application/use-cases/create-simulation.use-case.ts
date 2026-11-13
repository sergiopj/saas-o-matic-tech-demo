import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CUSTOMER_REPOSITORY_PORT } from '../../../customers/application/ports/out/customer-repository.port';
import type { CustomerRepositoryPort } from '../../../customers/application/ports/out/customer-repository.port';
import { SIMULATION_REPOSITORY_PORT } from '../ports/out/simulation-repository.port';
import type { SimulationRepositoryPort } from '../ports/out/simulation-repository.port';
import { Simulation } from '../../domain/entities/simulation.entity';
import { EntityNotFoundError } from '../../../../shared/domain/domain.exception';

export interface CreateSimulationCommand {
  customerId: string;
  activeUsers: number;
  storageGb: number;
  apiCalls: number;
}

@Injectable()
export class CreateSimulationUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY_PORT)
    private readonly customerRepository: CustomerRepositoryPort,
    @Inject(SIMULATION_REPOSITORY_PORT)
    private readonly simulationRepository: SimulationRepositoryPort,
  ) {}

  public async execute(command: CreateSimulationCommand): Promise<Simulation> {
    const customer = await this.customerRepository.findById(command.customerId);
    if (!customer) {
      throw new EntityNotFoundError('Customer', command.customerId);
    }

    const simulation = Simulation.create(
      {
        customerId: customer.getId(),
        customerCountry: customer.getCountry(),
        activeUsers: command.activeUsers,
        storageGb: command.storageGb,
        apiCalls: command.apiCalls,
      },
      uuidv4,
    );

    return this.simulationRepository.save(simulation);
  }
}
