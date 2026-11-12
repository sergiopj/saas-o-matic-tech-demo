import { DomainError } from '../../../../shared/domain/domain.exception';
import { EU_COUNTRIES, TAX_RATES } from '../../../../shared/domain/constants/fiscal.constants';

export interface TaxBreakdown {
    taxRate: number;
    taxAmount: number;
    totalCost: number;
}

export function getTaxRate(countryCode: string): number {
    const normalizedCode = countryCode.trim().toUpperCase();

    if (TAX_RATES[normalizedCode] !== undefined) {
        return TAX_RATES[normalizedCode];
    }

    if (EU_COUNTRIES.has(normalizedCode)) {
        return 0;
    }

    return 0;
}

export function calculateTaxBreakdown(baseCost: number, taxRate: number): TaxBreakdown {
    if (baseCost < 0 || taxRate < 0) {
        throw new DomainError('Base cost and tax rate must be greater than or equal to 0.');
    }

    const taxAmount = Math.round(baseCost * taxRate * 100) / 100;
    const totalCost = Math.round((baseCost + taxAmount) * 100) / 100;

    return { taxRate, taxAmount, totalCost };
}
