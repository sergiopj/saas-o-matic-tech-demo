import { Simulation } from "../../../domain/entities/simulation.entity";

export const SIMULATION_REPOSITORY_PORT = Symbol('SIMULATION_REPOSITORY_PORT');

export interface SimulationRepositoryPort {
    save(simulation: Simulation): Promise<Simulation>;
    findByCustomerId(customerId: string): Promise<Simulation[]>;
}