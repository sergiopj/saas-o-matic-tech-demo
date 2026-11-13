import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { AppModule } from './app.module';
import { ProblemDetailExceptionFilter } from './shared/infrastructure/filters/problem-detail-exception.filter';

// Load .env file natively in Node.js 20.6+ if present
const envPath = join(process.cwd(), '.env');
if (existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(envPath);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new ProblemDetailExceptionFilter());

  // Setup Swagger UI using OpenAPI 3.0 contract (Spec-Driven Development)
  const openApiCandidates = [
    join(process.cwd(), '../ai-workspace/01-specs/openapi.yaml'),
    join(process.cwd(), 'ai-workspace/01-specs/openapi.yaml'),
  ];
  const openApiPath = openApiCandidates.find((candidate) => existsSync(candidate));

  if (openApiPath) {
    const yamlContent = readFileSync(openApiPath, 'utf8');
    const openApiDocument = parse(yamlContent) as Parameters<typeof SwaggerModule.setup>[2];
    SwaggerModule.setup('docs', app, openApiDocument);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`SaaS-O-Matic API is running on: http://localhost:${port}`);
  console.log(`Swagger UI documentation is available on: http://localhost:${port}/docs`);
}
void bootstrap();
