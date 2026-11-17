import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmSqliteConfig } from './shared/infrastructure/persistence/typeorm.config';
import { CustomersModule } from './modules/customers/customers.module';
import { SimulationsModule } from './modules/simulations/simulations.module';
import { EmailsModule } from './modules/emails/emails.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmSqliteConfig),
    CustomersModule,
    SimulationsModule,
    EmailsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
