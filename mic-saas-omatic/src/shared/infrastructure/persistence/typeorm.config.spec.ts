import { typeOrmSqliteConfig } from './typeorm.config';

describe('typeOrmSqliteConfig', () => {
  it('should define better-sqlite3 configuration with WAL mode enabled', () => {
    expect(typeOrmSqliteConfig.type).toBe('better-sqlite3');
    expect(typeOrmSqliteConfig.database).toBeDefined();
    expect(typeOrmSqliteConfig.synchronize).toBe(true);
    expect(typeOrmSqliteConfig.enableWAL).toBe(true);
    expect(typeOrmSqliteConfig.autoLoadEntities).toBe(true);
  });
});
