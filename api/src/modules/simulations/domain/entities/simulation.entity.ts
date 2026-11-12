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
    const trimmedCustomerId = (payload.customerId || '').trim();
    if (!trimmedCustomerId) {
      throw new DomainError('Customer ID is required.');
    }

    const normalizedCountry = (payload.customerCountry || '').trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalizedCountry)) {
      throw new DomainError('Customer country must be a valid 2-letter ISO code.');
    }

    if (!Number.isInteger(payload.activeUsers) || payload.activeUsers < 0) {
      throw new DomainError('Active users must be an integer greater than or equal to 0.');
    }

    if (
      typeof payload.storageGb !== 'number' ||
      Number.isNaN(payload.storageGb) ||
      payload.storageGb < 0
    ) {
      throw new DomainError('Storage GB must be a number greater than or equal to 0.');
    }

    if (!Number.isInteger(payload.apiCalls) || payload.apiCalls < 0) {
      throw new DomainError('API calls must be an integer greater than or equal to 0.');
    }

    const monthlyBaseCost = calculateTieredPrice(payload.activeUsers);
    const taxRate = getTaxRate(normalizedCountry);
    const { taxAmount, totalCost } = calculateTaxBreakdown(monthlyBaseCost, taxRate);

    return new Simulation({
      id: payload.id || idGenerator(),
      customerId: trimmedCustomerId,
      activeUsers: payload.activeUsers,
      storageGb: payload.storageGb,
      apiCalls: payload.apiCalls,
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
