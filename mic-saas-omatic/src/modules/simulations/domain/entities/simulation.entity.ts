import { DomainError } from '../../../../shared/domain/domain.exception';
import { calculateTieredPrice } from '../services/pricing-engine.service';
import { calculateTaxBreakdown, getTaxRate } from '../services/tax-calculator.service';

export interface SimulationProperties {
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
  createdAt: Date;
}

export interface CreateSimulationPayload {
  id?: string;
  customerId: string;
  customerCountry: string;
  activeUsers: number;
  storageGb: number;
  apiCalls: number;
}

export class Simulation {
  private readonly id: string;
  private readonly customerId: string;
  private readonly activeUsers: number;
  private readonly storageGb: number;
  private readonly apiCalls: number;
  private readonly monthlyBaseCost: number;
  private readonly taxRate: number;
  private readonly taxAmount: number;
  private readonly totalCost: number;
  private readonly currency: string;
  private readonly createdAt: Date;

  private constructor(props: SimulationProperties) {
    this.id = props.id;
    this.customerId = props.customerId;
    this.activeUsers = props.activeUsers;
    this.storageGb = props.storageGb;
    this.apiCalls = props.apiCalls;
    this.monthlyBaseCost = props.monthlyBaseCost;
    this.taxRate = props.taxRate;
    this.taxAmount = props.taxAmount;
    this.totalCost = props.totalCost;
    this.currency = props.currency ?? 'EUR';
    this.createdAt = props.createdAt;
  }

  public static create(
    payload: CreateSimulationPayload,
    idGenerator: () => string,
  ): Simulation {
    const customerId = Simulation.validateCustomerId(payload.customerId);
    const customerCountry = Simulation.validateCountry(payload.customerCountry);
    const activeUsers = Simulation.validateActiveUsers(payload.activeUsers);
    const storageGb = Simulation.validateStorageGb(payload.storageGb);
    const apiCalls = Simulation.validateApiCalls(payload.apiCalls);

    const monthlyBaseCost = calculateTieredPrice(activeUsers);
    const taxRate = getTaxRate(customerCountry);
    const { taxAmount, totalCost } = calculateTaxBreakdown(monthlyBaseCost, taxRate);

    return new Simulation({
      id: payload.id || idGenerator(),
      customerId,
      activeUsers,
      storageGb,
      apiCalls,
      monthlyBaseCost,
      taxRate,
      taxAmount,
      totalCost,
      currency: 'EUR',
      createdAt: new Date(),
    });
  }

  public static reconstitute(props: SimulationProperties): Simulation {
    return new Simulation(props);
  }

  private static validateCustomerId(customerId?: string): string {
    const trimmed = (customerId || '').trim();
    if (!trimmed) {
      throw new DomainError('Customer ID is required.');
    }
    return trimmed;
  }

  private static validateCountry(country?: string): string {
    const normalized = (country || '').trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalized)) {
      throw new DomainError('Customer country must be a valid 2-letter ISO code.');
    }
    return normalized;
  }

  private static validateActiveUsers(activeUsers: number): number {
    if (!Number.isInteger(activeUsers) || activeUsers < 0) {
      throw new DomainError('Active users must be an integer greater than or equal to 0.');
    }
    return activeUsers;
  }

  private static validateStorageGb(storageGb: number): number {
    if (
      typeof storageGb !== 'number' ||
      Number.isNaN(storageGb) ||
      storageGb < 0
    ) {
      throw new DomainError('Storage GB must be a number greater than or equal to 0.');
    }
    return storageGb;
  }

  private static validateApiCalls(apiCalls: number): number {
    if (!Number.isInteger(apiCalls) || apiCalls < 0) {
      throw new DomainError('API calls must be an integer greater than or equal to 0.');
    }
    return apiCalls;
  }

  public getId(): string {
    return this.id;
  }

  public getCustomerId(): string {
    return this.customerId;
  }

  public getActiveUsers(): number {
    return this.activeUsers;
  }

  public getStorageGb(): number {
    return this.storageGb;
  }

  public getApiCalls(): number {
    return this.apiCalls;
  }

  public getMonthlyBaseCost(): number {
    return this.monthlyBaseCost;
  }

  public getTaxRate(): number {
    return this.taxRate;
  }

  public getTaxAmount(): number {
    return this.taxAmount;
  }

  public getTotalCost(): number {
    return this.totalCost;
  }

  public getCurrency(): string {
    return this.currency;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public toJSON(): SimulationProperties {
    return {
      id: this.id,
      customerId: this.customerId,
      activeUsers: this.activeUsers,
      storageGb: this.storageGb,
      apiCalls: this.apiCalls,
      monthlyBaseCost: this.monthlyBaseCost,
      taxRate: this.taxRate,
      taxAmount: this.taxAmount,
      totalCost: this.totalCost,
      currency: this.currency,
      createdAt: this.createdAt,
    };
  }
}
