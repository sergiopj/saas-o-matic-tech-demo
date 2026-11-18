import {
  normalizeTaxId,
  isValidTaxId,
} from '../services/tax-id.validator';
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

export interface UpdateCustomerPayload {
  companyName?: string;
  taxId?: string;
  email?: string;
  country?: string;
  selectedPlan?: string;
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
    const companyName = Customer.validateCompanyName(payload.companyName);
    const country = Customer.validateCountry(payload.country);
    const taxId = Customer.validateTaxId(payload.taxId, country);
    const email = Customer.validateEmail(payload.email);
    const selectedPlan = Customer.validatePlan(payload.selectedPlan);

    return new Customer({
      id: payload.id || idGenerator(),
      companyName,
      taxId,
      email,
      country,
      selectedPlan,
      createdAt: new Date(),
    });
  }

  public static reconstitute(props: CustomerProperties): Customer {
    return new Customer(props);
  }

  public update(payload: UpdateCustomerPayload): Customer {
    const nextCompanyName =
      payload.companyName !== undefined
        ? Customer.validateCompanyName(payload.companyName)
        : this.companyName;

    const nextCountry =
      payload.country !== undefined
        ? Customer.validateCountry(payload.country)
        : this.country;

    const nextTax =
      payload.taxId !== undefined || payload.country !== undefined
        ? Customer.validateTaxId(payload.taxId ?? this.taxId, nextCountry)
        : this.taxId;

    const nextEmail =
      payload.email !== undefined
        ? Customer.validateEmail(payload.email)
        : this.email;

    const nextPlan =
      payload.selectedPlan !== undefined
        ? Customer.validatePlan(payload.selectedPlan)
        : this.selectedPlan;

    return new Customer({
      id: this.id,
      companyName: nextCompanyName,
      taxId: nextTax,
      email: nextEmail,
      country: nextCountry,
      selectedPlan: nextPlan,
      createdAt: this.createdAt,
    });
  }

  private static validateCompanyName(companyName?: string): string {
    const trimmed = (companyName || '').trim();
    if (!trimmed || trimmed.length < 2) {
      throw new DomainError('Company name must have at least 2 characters.');
    }
    return trimmed;
  }

  private static validateCountry(country?: string): string {
    const normalized = (country || '').trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalized)) {
      throw new DomainError('Country must be a valid 2-letter ISO 3166-1 alpha-2 code.');
    }
    return normalized;
  }

  private static validateTaxId(rawTaxId: string, country: string): string {
    const normalized = normalizeTaxId(rawTaxId);
    if (!isValidTaxId(normalized, country)) {
      throw new DomainError(
        `Invalid tax identifier '${rawTaxId}' for country '${country}'.`,
      );
    }
    return normalized;
  }

  private static validateEmail(email?: string): string {
    const trimmed = (email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
    if (!emailRegex.test(trimmed)) {
      throw new DomainError(`Invalid email address format '${email}'.`);
    }
    return trimmed;
  }

  private static validatePlan(selectedPlan?: string): string {
    const trimmed = (selectedPlan || '').trim();
    if (!trimmed || trimmed.length < 2) {
      throw new DomainError('Selected plan must have at least 2 characters.');
    }
    return trimmed;
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
