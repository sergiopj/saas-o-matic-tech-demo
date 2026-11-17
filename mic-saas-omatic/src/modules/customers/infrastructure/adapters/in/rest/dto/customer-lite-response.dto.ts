import { Customer } from '../../../../../domain/entities/customer.entity';

/**
 * Lightweight Read-Model Projection for high-performance dashboards (e.g. Executive Home).
 * Eliminates over-fetching by projecting only vital identity and jurisdictional attributes.
 */
export class CustomerLiteResponseDto {
  id: string;
  companyName: string;
  country: string;

  public static fromDomain(customer: Customer): CustomerLiteResponseDto {
    const dto = new CustomerLiteResponseDto();
    dto.id = customer.getId();
    dto.companyName = customer.getCompanyName();
    dto.country = customer.getCountry();
    return dto;
  }
}
