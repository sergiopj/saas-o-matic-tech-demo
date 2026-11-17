import { DataSource } from 'typeorm';
import { CustomerTypeOrmEntity } from './modules/customers/infrastructure/adapters/out/persistence/customer.typeorm-entity';
import { SimulationTypeOrmEntity } from './modules/simulations/infrastructure/adapters/out/persistence/simulation.typeorm-entity';

/**
 * TypeORM Data Source configuration for CLI migrations and enterprise schema evolution.
 *
 * In local development and tech demo evaluation, the NestJS application boots with
 * `synchronize: true` and an idempotent auto-seeder (`DatabaseSeederService`) for zero-friction DX.
 *
 * In production pipelines (PostgreSQL / MySQL), this DataSource provides the entry point for
 * versioned DDL migration execution via TypeORM CLI (`migration:run`, `migration:generate`).
 */
export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: process.env.DATABASE_NAME || 'saas_o_matic.sqlite',
  entities: [CustomerTypeOrmEntity, SimulationTypeOrmEntity],
  migrations: ['src/infrastructure/adapters/out/persistence/migrations/*.ts'],
  synchronize: false,
  logging: false,
  enableWAL: true,
});

export default AppDataSource;
