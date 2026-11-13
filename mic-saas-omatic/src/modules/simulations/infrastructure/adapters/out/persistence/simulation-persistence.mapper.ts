import { Simulation } from '../../../../domain/entities/simulation.entity';
import { SimulationTypeOrmEntity } from './simulation.typeorm-entity';

export class SimulationPersistenceMapper {
    public static toDomain(entity: SimulationTypeOrmEntity): Simulation {
        return Simulation.reconstitute({
            id: entity.id,
            customerId: entity.customerId,
            activeUsers: entity.activeUsers,
            storageGb: entity.storageGb,
            apiCalls: entity.apiCalls,
            monthlyBaseCost: Number(entity.monthlyBaseCost),
            taxRate: Number(entity.taxRate),
            taxAmount: Number(entity.taxAmount),
            totalCost: Number(entity.totalCost),
            currency: 'EUR',
            createdAt: entity.createdAt,
        });
    }

    public static toTypeOrm(domain: Simulation): SimulationTypeOrmEntity {
        const entity = new SimulationTypeOrmEntity();
        entity.id = domain.getId();
        entity.customerId = domain.getCustomerId();
        entity.activeUsers = domain.getActiveUsers();
        entity.storageGb = domain.getStorageGb();
        entity.apiCalls = domain.getApiCalls();
        entity.monthlyBaseCost = domain.getMonthlyBaseCost();
        entity.taxRate = domain.getTaxRate();
        entity.taxAmount = domain.getTaxAmount();
        entity.totalCost = domain.getTotalCost();
        entity.createdAt = domain.getCreatedAt();
        return entity;
    }
}
