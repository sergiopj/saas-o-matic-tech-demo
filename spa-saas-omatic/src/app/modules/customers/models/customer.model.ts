export type CustomerSortBy = 'companyName' | 'createdAt' | 'country' | 'taxId';
export type SortOrder = 'ASC' | 'DESC';

/**
 * Canonical ISO 3166-1 alpha-2 corporate customer jurisdictions supported by SaaS-O-Matic.
 */
export const SUPPORTED_FISCAL_COUNTRIES: readonly string[] = [
  'CH',
  'DE',
  'ES',
  'FR',
  'GB',
  'IT',
  'SE',
  'US',
] as const;

export interface Customer {
    id: string;
    companyName: string;
    taxId: string;
    email: string;
    country: string;
    selectedPlan: string;
    createdAt: string;
}

/**
 * Lightweight Read-Model Projection for dashboards (e.g. Executive Home).
 * Eliminates over-fetching by projecting only vital identity and jurisdictional attributes.
 */
export interface CustomerLite {
    id: string;
    companyName: string;
    country: string;
}

export interface CustomerCreate {
    companyName: string;
    taxId: string;
    email: string;
    country: string;
    selectedPlan: string;
}