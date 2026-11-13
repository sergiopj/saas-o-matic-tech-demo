import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { SimulationRepositoryPort } from '../../../../application/ports/out/simulation-repository.port';
import { Simulation } from '../../../../domain/entities/simulation.entity';
import { SimulationTypeOrmEntity } from './simulation.typeorm-entity';
import { SimulationPersistenceMapper } from './simulation-persistence.mapper';

@Injectable()
export class SimulationPersistenceAdapter implements SimulationRepositoryPort {
  constructor(
    @InjectRepository(SimulationTypeOrmEntity)
    private readonly repository: Repository<SimulationTypeOrmEntity>,
  ) {}

  async save(simulation: Simulation): Promise<Simulation> {
    const typeOrmEntity = SimulationPersistenceMapper.toTypeOrm(simulation);
    const saved = await this.repository.save(typeOrmEntity);
    return SimulationPersistenceMapper.toDomain(saved);
  }

  async findByCustomerId(customerId: string): Promise<Simulation[]> {
    const records = await this.repository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
    return records.map(SimulationPersistenceMapper.toDomain);
  }
}
