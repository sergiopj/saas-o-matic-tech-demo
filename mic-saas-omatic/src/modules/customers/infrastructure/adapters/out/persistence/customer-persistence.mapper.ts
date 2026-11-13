import { Customer } from '../../../../domain/entities/customer.entity';
import { CustomerTypeOrmEntity } from './customer.typeorm-entity';

export class CustomerPersistenceMapper {
  public static toDomain(entity: CustomerTypeOrmEntity): Customer {
    return Customer.reconstitute({
      id: entity.id,
      companyName: entity.companyName,
      taxId: entity.taxId,
      email: entity.email,
      country: entity.country,
      selectedPlan: entity.selectedPlan,
      createdAt: entity.createdAt,
    });
  }

  public static toTypeOrm(domain: Customer): CustomerTypeOrmEntity {
    const entity = new CustomerTypeOrmEntity();
    entity.id = domain.getId();
    entity.companyName = domain.getCompanyName();
    entity.taxId = domain.getTaxId();
    entity.email = domain.getEmail();
    entity.country = domain.getCountry();
    entity.selectedPlan = domain.getSelectedPlan();
    entity.createdAt = domain.getCreatedAt();
    return entity;
  }
}

