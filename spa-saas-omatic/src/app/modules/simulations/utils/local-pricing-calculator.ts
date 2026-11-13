import { SimulationProjection } from '../models/simulation.model';
import { CurrencyCode } from '../../../core/models/currency.model';

const EU_COUNTRY_CODES = new Set([
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI',
  'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT',
  'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
]);

const SPECIFIC_TAX_RATES: Record<string, number> = {
  ES: 0.21,
  DE: 0.19,
  FR: 0.20,
  IT: 0.22,
  GB: 0.20,
  US: 0.00,
};

export function calculateBaseCost(users: number): number {
  if (users <= 0) {
    return 0;
  }
  if (users <= 10) {
    return users * 10;
  }
  if (users <= 50) {
    return 100 + (users - 10) * 8;
  }
  return 420 + (users - 50) * 5;
}

export function resolveTaxRate(countryCode: string): number {
  const normalizedCountry = countryCode?.trim().toUpperCase() || 'ES';

  if (normalizedCountry in SPECIFIC_TAX_RATES) {
    return SPECIFIC_TAX_RATES[normalizedCountry];
  }

  // EU B2B reverse charge (0%) or rest of world (0%)
  if (EU_COUNTRY_CODES.has(normalizedCountry)) {
    return 0.00;
  }

  return 0.00;
}

export function projectSimulationCost(
  activeUsers: number,
  storageGb: number,
  apiCalls: number,
  country: string,
  targetCurrency: CurrencyCode = 'EUR',
  exchangeRate: number = 1
): SimulationProjection {
  const safeUsers = Math.max(0, Math.floor(activeUsers || 0));
  const safeStorage = Math.max(0, storageGb || 0);
  const safeApiCalls = Math.max(0, Math.floor(apiCalls || 0));

  const monthlyBaseCostEur = calculateBaseCost(safeUsers);
  const taxRate = resolveTaxRate(country);
  const rawTaxAmount = monthlyBaseCostEur * taxRate;
  const taxAmountEur = Math.round(rawTaxAmount * 100) / 100;
  const totalCostEur = Math.round((monthlyBaseCostEur + taxAmountEur) * 100) / 100;

  const rate = exchangeRate > 0 ? exchangeRate : 1;
  const convertedTotalCost = Math.round(totalCostEur * rate * 100) / 100;

  return {
    activeUsers: safeUsers,
    storageGb: safeStorage,
    apiCalls: safeApiCalls,
    monthlyBaseCostEur,
    taxRate,
    taxAmountEur,
    totalCostEur,
    convertedTotalCost,
    targetCurrency,
  };
}
