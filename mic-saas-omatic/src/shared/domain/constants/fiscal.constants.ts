export interface PricingTier {
    upTo: number;
    price: number;
}

export const PRICING_TIERS: ReadonlyArray<PricingTier> = [
    { upTo: 10, price: 10 },
    { upTo: 50, price: 8 },
    { upTo: Infinity, price: 5 },
];

export const TAX_RATES: Readonly<Record<string, number>> = {
    ES: 0.21,
    DE: 0.19,
    FR: 0.20,
    IT: 0.22,
    GB: 0.20,
    US: 0,
};

export const EU_COUNTRIES: ReadonlySet<string> = new Set([
    'AT', 'BE', 'BG', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE',
    'GR', 'HU', 'HR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
]);
