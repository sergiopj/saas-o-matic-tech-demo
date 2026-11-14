import { getCountryFlag, COUNTRY_FLAGS } from './country-flag.util';

describe('getCountryFlag', () => {
  it('should return emoji flags for known ISO codes in the canonical dictionary', () => {
    expect(getCountryFlag('ES')).toBe('🇪🇸');
    expect(getCountryFlag('US')).toBe('🇺🇸');
    expect(getCountryFlag('DE')).toBe('🇩🇪');
    expect(getCountryFlag('FR')).toBe('🇫🇷');
    expect(getCountryFlag('GB')).toBe('🇬🇧');
    expect(getCountryFlag('IT')).toBe('🇮🇹');
    expect(getCountryFlag('PT')).toBe('🇵🇹');
  });

  it('should normalize lowercase input and trim outer whitespace', () => {
    expect(getCountryFlag('es')).toBe('🇪🇸');
    expect(getCountryFlag(' us ')).toBe('🇺🇸');
    expect(getCountryFlag('  de  ')).toBe('🇩🇪');
  });

  it('should return fallback globe emoji for unknown, invalid, null or empty inputs', () => {
    expect(getCountryFlag(null)).toBe('🌐');
    expect(getCountryFlag(undefined)).toBe('🌐');
    expect(getCountryFlag('')).toBe('🌐');
    expect(getCountryFlag('   ')).toBe('🌐');
    expect(getCountryFlag('XYZ')).toBe('🌐');
    expect(getCountryFlag('123')).toBe('🌐');
  });

  it('should expose COUNTRY_FLAGS as an immutable dictionary with primary jurisdictions', () => {
    expect(COUNTRY_FLAGS['ES']).toBe('🇪🇸');
    expect(Object.keys(COUNTRY_FLAGS).length).toBeGreaterThanOrEqual(20);
  });
});
