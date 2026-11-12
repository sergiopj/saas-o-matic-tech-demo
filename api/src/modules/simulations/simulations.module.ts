import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from '../customers/customers.module';
import { SimulationTypeOrmEntity } from './infrastructure/adapters/out/persistence/simulation.typeorm-entity';
import { SimulationPersistenceAdapter } from './infrastructure/adapters/out/persistence/simulation-persistence.adapter';
import { SIMULATION_REPOSITORY_PORT } from './application/ports/out/simulation-repository.port';
import { CreateSimulationUseCase } from './application/use-cases/create-simulation.use-case';
import { SimulationController } from './infrastructure/adapters/in/rest/simulation.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SimulationTypeOrmEntity]),
    CustomersModule,
  ],
  controllers: [SimulationController],
  providers: [
    CreateSimulationUseCase,
    {
      provide: SIMULATION_REPOSITORY_PORT,
      useClass: SimulationPersistenceAdapter,
    },
  ],
  exports: [SIMULATION_REPOSITORY_PORT, TypeOrmModule],
})
export class SimulationsModule {}
