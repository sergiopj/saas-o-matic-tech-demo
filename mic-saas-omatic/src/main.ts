import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ProblemDetailExceptionFilter } from './shared/infrastructure/filters/problem-detail-exception.filter';

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

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`SaaS-O-Matic API is running on: http://localhost:${port}`);
}
void bootstrap();
