import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DatabaseSeederService } from './shared/infrastructure/persistence/database-seeder.service';

async function bootstrapSeed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const seeder = app.get(DatabaseSeederService);
  console.log('🌱 [Seeder] Starting manual database seeding (force mode)...');

  try {
    const result = await seeder.seed(true);
    console.log(
      `✅ [Seeder] Seeding completed: ${result.customersCount} customers, ${result.simulationsCount} simulations.`,
    );
  } catch (error) {
    console.error('❌ [Seeder] Seeding error:', error);
    process.exit(1);
  } finally {
    await app.close();
  }

  process.exit(0);
}

void bootstrapSeed();
