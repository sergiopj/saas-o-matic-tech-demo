import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmSqliteConfig: TypeOrmModuleOptions = {
  type: 'better-sqlite3',
  database: 'saas_o_matic.sqlite',
  autoLoadEntities: true,
  synchronize: true,
  logging: false,
};
