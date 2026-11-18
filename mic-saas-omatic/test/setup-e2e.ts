import { unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';

process.env.DATABASE_NAME = 'saas_o_matic.test.sqlite';
process.env.SKIP_SEEDING = 'true';

const filesToClean = [
  'saas_o_matic.test.sqlite',
  'saas_o_matic.test.sqlite-wal',
  'saas_o_matic.test.sqlite-shm',
];

for (const file of filesToClean) {
  const candidates = [file, join(process.cwd(), 'mic-saas-omatic', file), join(process.cwd(), file)];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      try {
        unlinkSync(candidate);
      } catch {
        // ignore
      }
    }
  }
}
