import { Customer } from "../../../../../domain/entities/customer.entity";

export interface SimulationSummaryDto {
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
}

export class CustomerDetailResponseDto {
  id: string;
  companyName: string;
  taxId: string;
  email: string;
  country: string;
  selectedPlan: string;
  createdAt: string;
  simulations: SimulationSummaryDto[];

  public static fromDomain(
    customer: Customer,
    simulations: SimulationSummaryDto[] = [],
  ): CustomerDetailResponseDto {
    const dto = new CustomerDetailResponseDto();
    dto.id = customer.getId();
    dto.companyName = customer.getCompanyName();
    dto.taxId = customer.getTaxId();
    dto.email = customer.getEmail();
    dto.country = customer.getCountry();
    dto.selectedPlan = customer.getSelectedPlan();
    dto.createdAt = customer.getCreatedAt().toISOString();
    dto.simulations = simulations;
    return dto;
  }
}
