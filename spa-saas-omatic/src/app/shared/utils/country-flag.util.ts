/**
 * Canonical country flag mapping by ISO 3166-1 alpha-2 code.
 *
 * Clean Code Principle (Maintainability & Zero Magic Numbers):
 * - Replaces opaque algorithms with hex Unicode constants (e.g., 0x1F1E6)
 *   with an explicit, typed, declarative lookup dictionary.
 * - Guarantees O(1) in-memory lookup time.
 * - Easily maintainable and extensible without requiring knowledge of Unicode internals.
 */
export const COUNTRY_FLAGS: Readonly<Record<string, string>> = {
  // Primary fiscal and commercial jurisdictions (EU & Global)
  ES: '🇪🇸', // Spain
  US: '🇺🇸', // United States
  DE: '🇩🇪', // Germany
  FR: '🇫🇷', // France
  GB: '🇬🇧', // United Kingdom
  IT: '🇮🇹', // Italy
  PT: '🇵🇹', // Portugal
  NL: '🇳🇱', // Netherlands
  BE: '🇧🇪', // Belgium
  IE: '🇮🇪', // Ireland
  CH: '🇨🇭', // Switzerland
  AT: '🇦🇹', // Austria
  SE: '🇸🇪', // Sweden
  NO: '🇳🇴', // Norway
  DK: '🇩🇰', // Denmark
  FI: '🇫🇮', // Finland
  PL: '🇵🇱', // Poland
  GR: '🇬🇷', // Greece
  CZ: '🇨🇿', // Czech Republic
  RO: '🇷🇴', // Romania
  LU: '🇱🇺', // Luxembourg
  // Strategic international markets
  MX: '🇲🇽', // Mexico
  CA: '🇨🇦', // Canada
  BR: '🇧🇷', // Brazil
  AR: '🇦🇷', // Argentina
  CO: '🇨🇴', // Colombia
  CL: '🇨🇱', // Chile
  JP: '🇯🇵', // Japan
  AU: '🇦🇺', // Australia
  CN: '🇨🇳', // China
  IN: '🇮🇳', // India
  SG: '🇸🇬', // Singapore
  AE: '🇦🇪', // United Arab Emirates
};

/**
 * Returns the corresponding flag emoji for a given ISO 3166-1 alpha-2 code.
 *
 * @param isoCode Two-letter ISO country code (e.g. 'ES', 'us', ' de ')
 * @returns The flag emoji or '🌐' as a safe, accessible fallback.
 */
export function getCountryFlag(isoCode: string | null | undefined): string {
  if (!isoCode || typeof isoCode !== 'string') {
    return '🌐';
  }

  const normalizedCode = isoCode.trim().toUpperCase();
  return COUNTRY_FLAGS[normalizedCode] ?? '🌐';
}
