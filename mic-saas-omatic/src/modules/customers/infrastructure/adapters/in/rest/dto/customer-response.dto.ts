import { Customer } from "../../../../../domain/entities/customer.entity";

export class CustomerResponseDto {
  id: string;
  companyName: string;
  taxId: string;
  email: string;
  country: string;
  selectedPlan: string;
  createdAt: string;

  public static fromDomain(customer: Customer): CustomerResponseDto {
    const dto = new CustomerResponseDto();
    dto.id = customer.getId();
    dto.companyName = customer.getCompanyName();
    dto.taxId = customer.getTaxId();
    dto.email = customer.getEmail();
    dto.country = customer.getCountry();
    dto.selectedPlan = customer.getSelectedPlan();
    dto.createdAt = customer.getCreatedAt().toISOString();
    return dto;
  }
}

