import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmSqliteConfig: TypeOrmModuleOptions = {
  type: 'better-sqlite3',
  database: process.env.DATABASE_NAME || 'saas_o_matic.sqlite',
  autoLoadEntities: true,
  synchronize: true,
  logging: false,
  enableWAL: true,
};
