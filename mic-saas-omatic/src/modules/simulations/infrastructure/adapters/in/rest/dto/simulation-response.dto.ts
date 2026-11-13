import { Simulation } from "../../../../../domain/entities/simulation.entity";

export class SimulationResponseDto {
  id: string;
  customerId: string;
  activeUsers: number;
  storageGb: number;
  apiCalls: number;
  monthlyBaseCost: number;
  taxRate: number;
  taxAmount: number;
  totalCost: number;
  currency: string;
  createdAt: string;

  public static fromDomain(simulation: Simulation): SimulationResponseDto {
    const dto = new SimulationResponseDto();
    dto.id = simulation.getId();
    dto.customerId = simulation.getCustomerId();
    dto.activeUsers = simulation.getActiveUsers();
    dto.storageGb = simulation.getStorageGb();
    dto.apiCalls = simulation.getApiCalls();
    dto.monthlyBaseCost = simulation.getMonthlyBaseCost();
    dto.taxRate = simulation.getTaxRate();
    dto.taxAmount = simulation.getTaxAmount();
    dto.totalCost = simulation.getTotalCost();
    dto.currency = simulation.getCurrency();
    dto.createdAt = simulation.getCreatedAt().toISOString();
    return dto;
  }
}
