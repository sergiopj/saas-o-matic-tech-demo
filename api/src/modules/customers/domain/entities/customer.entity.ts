import { normalizeTaxId } from '../value-objects/tax-id.vo';
import { isValidTaxId } from '../services/spanish-fiscal.validator';
import { DomainError } from '../../../../shared/domain/domain.exception';

export interface CustomerProperties {
  id: string;
  companyName: string;
  taxId: string;
  email: string;
  country: string;
  selectedPlan: string;
  createdAt: Date;
}

export interface CreateCustomerPayload {
  id?: string;
  companyName: string;
  taxId: string;
  email: string;
  country: string;
  selectedPlan: string;
}

export class Customer {
  private readonly id: string;
  private readonly companyName: string;
  private readonly taxId: string;
  private readonly email: string;
  private readonly country: string;
  private readonly selectedPlan: string;
  private readonly createdAt: Date;

  private constructor(props: CustomerProperties) {
    this.id = props.id;
    this.companyName = props.companyName;
    this.taxId = props.taxId;
    this.email = props.email;
    this.country = props.country;
    this.selectedPlan = props.selectedPlan;
    this.createdAt = props.createdAt;
  }

  public static create(
    payload: CreateCustomerPayload,
    idGenerator: () => string,
  ): Customer {
    const trimmedCompanyName = (payload.companyName || '').trim();
    if (!trimmedCompanyName || trimmedCompanyName.length < 2) {
      throw new DomainError('Company name must have at least 2 characters.');
    }

    const normalizedCountry = (payload.country || '').trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalizedCountry)) {
      throw new DomainError('Country must be a valid 2-letter ISO 3166-1 alpha-2 code.');
    }

    const normalizedTax = normalizeTaxId(payload.taxId);
    if (!isValidTaxId(normalizedTax, normalizedCountry)) {
      throw new DomainError(
        `Invalid tax identifier '${payload.taxId}' for country '${normalizedCountry}'.`,
      );
    }

    const trimmedEmail = (payload.email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      throw new DomainError(`Invalid email address format '${payload.email}'.`);
    }

    const trimmedPlan = (payload.selectedPlan || '').trim();
    if (!trimmedPlan || trimmedPlan.length < 2) {
      throw new DomainError('Selected plan must have at least 2 characters.');
    }

    return new Customer({
      id: payload.id || idGenerator(),
      companyName: trimmedCompanyName,
      taxId: normalizedTax,
      email: trimmedEmail,
      country: normalizedCountry,
      selectedPlan: trimmedPlan,
      createdAt: new Date(),
    });
  }

  public static reconstitute(props: CustomerProperties): Customer {
    return new Customer(props);
  }

  public getId(): string {
    return this.id;
  }

  public getCompanyName(): string {
    return this.companyName;
  }

  public getTaxId(): string {
    return this.taxId;
  }

  public getEmail(): string {
    return this.email;
  }

  public getCountry(): string {
    return this.country;
  }

  public getSelectedPlan(): string {
    return this.selectedPlan;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public toJSON(): CustomerProperties {
    return {
      id: this.id,
      companyName: this.companyName,
      taxId: this.taxId,
      email: this.email,
      country: this.country,
      selectedPlan: this.selectedPlan,
      createdAt: this.createdAt,
    };
  }
}
