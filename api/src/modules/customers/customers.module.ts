import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerTypeOrmEntity } from './infrastructure/adapters/out/persistence/customer.typeorm-entity';
import { CustomerPersistenceAdapter } from './infrastructure/adapters/out/persistence/customer-persistence.adapter';
import { CUSTOMER_REPOSITORY_PORT } from './application/ports/out/customer-repository.port';
import { CreateCustomerUseCase } from './application/use-cases/create-customer.use-case';
import { ListCustomersUseCase } from './application/use-cases/list-customers.use-case';
import { GetCustomerDetailUseCase } from './application/use-cases/get-customer-detail.use-case';
import { CustomerController } from './infrastructure/adapters/in/rest/customer.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerTypeOrmEntity])],
  controllers: [CustomerController],
  providers: [
    CreateCustomerUseCase,
    ListCustomersUseCase,
    GetCustomerDetailUseCase,
    {
      provide: CUSTOMER_REPOSITORY_PORT,
      useClass: CustomerPersistenceAdapter,
    },
  ],
  exports: [CUSTOMER_REPOSITORY_PORT, TypeOrmModule],
})
export class CustomersModule {}
