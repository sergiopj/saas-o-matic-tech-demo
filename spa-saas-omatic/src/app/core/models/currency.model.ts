export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'JPY'] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export interface CurrencyOption {
  code: CurrencyCode;
  label: string;
  symbol: string;
}

// Exchange rate API contract (open.er-api.com/v6/latest/EUR)
export interface ExchangeRateApiResponse {
  result: string;
  base_code: string;
  time_last_update_utc: string;
  rates: Record<string, number>;
}
