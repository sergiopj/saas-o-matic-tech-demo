import { Inject, Injectable } from '@nestjs/common';
import { SIMULATION_REPOSITORY_PORT } from '../ports/out/simulation-repository.port';
import type { SimulationRepositoryPort } from '../ports/out/simulation-repository.port';
import { Simulation } from '../../domain/entities/simulation.entity';

@Injectable()
export class ListSimulationsByCustomerUseCase {
  constructor(
    @Inject(SIMULATION_REPOSITORY_PORT)
    private readonly simulationRepository: SimulationRepositoryPort,
  ) {}

  public async execute(customerId: string): Promise<Simulation[]> {
    return this.simulationRepository.findByCustomerId(customerId);
  }
}
