export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'JPY'] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export interface CurrencyMetadata {
    label: string;
    symbol: string;
    locale: string;
    decimals: number;
}

export const CURRENCY_METADATA: Record<CurrencyCode, CurrencyMetadata> = {
    EUR: { label: 'Euro', symbol: '€', locale: 'es-ES', decimals: 2 },
    USD: { label: 'US Dollar', symbol: '$', locale: 'en-US', decimals: 2 },
    GBP: { label: 'British Pound', symbol: '£', locale: 'en-GB', decimals: 2 },
    CHF: { label: 'Swiss Franc', symbol: 'CHF', locale: 'de-CH', decimals: 2 },
    CAD: { label: 'Canadian Dollar', symbol: 'CA$', locale: 'en-CA', decimals: 2 },
    JPY: { label: 'Japanese Yen', symbol: '¥', locale: 'ja-JP', decimals: 0 },
};

export interface CurrencyOption {
    code: CurrencyCode;
    label: string;
    symbol: string;
}

export interface ExchangeRateApiResponse {
    result: string;
    base_code: string;
    time_last_update_utc: string;
    rates: Record<string, number>;
}
