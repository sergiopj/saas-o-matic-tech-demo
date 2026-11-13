import { unlinkSync, existsSync } from 'node:fs';

process.env.DATABASE_NAME = 'saas_o_matic.test.sqlite';

const filesToClean = [
  'saas_o_matic.test.sqlite',
  'saas_o_matic.test.sqlite-wal',
  'saas_o_matic.test.sqlite-shm',
];

for (const file of filesToClean) {
  if (existsSync(file)) {
    try {
      unlinkSync(file);
    } catch {
      // ignore
    }
  }
}
