import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmSqliteConfig: TypeOrmModuleOptions = {
  type: 'better-sqlite3',
  database: 'saas_o_matic.sqlite',
  entities: [__dirname + '/../../../../modules/**/*.typeorm-entity{.ts,.js}'],
  synchronize: true,
  logging: false,
};
