import {
  isValidTaxId,
  isValidDni,
  isValidNie,
  isValidCif,
} from './spanish-fiscal.validator';
import { normalizeTaxId } from '../value-objects/tax-id.vo';

describe('SpanishFiscalValidator & TaxId VO (Domain Layer)', () => {
  describe('normalizeTaxId', () => {
    it('should trim, convert to uppercase, and strip hyphens and spaces', () => {
      expect(normalizeTaxId('  b-12345674  ')).toBe('B12345674');
      expect(normalizeTaxId('x - 1234567 l')).toBe('X1234567L');
      expect(normalizeTaxId('12345678-z')).toBe('12345678Z');
    });

    it('should return empty string for null, undefined, or empty values', () => {
      expect(normalizeTaxId('')).toBe('');
      // @ts-expect-error testing invalid inputs
      expect(normalizeTaxId(null)).toBe('');
      // @ts-expect-error testing invalid inputs
      expect(normalizeTaxId(undefined)).toBe('');
    });
  });

  describe('DNI validation (modulo 23)', () => {
    it('should validate a correct Spanish DNI', () => {
      // 12345678 % 23 = 14 -> 'Z'
      expect(isValidDni('12345678Z')).toBe(true);
      expect(isValidTaxId('12345678Z', 'ES')).toBe(true);
    });

    it('should reject a DNI with an invalid control letter', () => {
      // 'A' is wrong, expected 'Z'
      expect(isValidDni('12345678A')).toBe(false);
      expect(isValidTaxId('12345678A', 'ES')).toBe(false);
    });

    it('should reject invalid DNI formats', () => {
      expect(isValidDni('1234567Z')).toBe(false); // only 7 digits
      expect(isValidDni('123456789Z')).toBe(false); // 9 digits
      expect(isValidDni('ABCDEFGHZ')).toBe(false); // non-digits
    });
  });

  describe('NIE validation (X/Y/Z prefix + modulo 23)', () => {
    it('should validate correct NIEs with X, Y, and Z prefixes', () => {
      // X prefix: X1234567L -> 01234567 % 23 = 19 -> 'L'
      expect(isValidNie('X1234567L')).toBe(true);
      expect(isValidTaxId('X1234567L', 'ES')).toBe(true);

      // Y prefix: Y1234567X -> 11234567 % 23 = 10 -> 'X'
      expect(isValidNie('Y1234567X')).toBe(true);

      // Z prefix: Z1234567R -> 21234567 % 23 = 1 -> 'R'
      expect(isValidNie('Z1234567R')).toBe(true);
    });

    it('should reject a NIE with incorrect control letter', () => {
      expect(isValidNie('X1234567A')).toBe(false);
      expect(isValidTaxId('X1234567A', 'ES')).toBe(false);
    });
  });

  describe('CIF validation (AEAT official algorithm)', () => {
    it('should validate B12345674 (Type B requires numerical digit control 4)', () => {
      expect(isValidCif('B12345674')).toBe(true);
      expect(isValidTaxId('B12345674', 'ES')).toBe(true);
    });

    it('should reject B12345678 (matching format regex but failing mathematical checksum)', () => {
      expect(isValidCif('B12345678')).toBe(false);
      expect(isValidTaxId('B12345678', 'ES')).toBe(false);
    });

    it('should validate P1234567D (Type P strictly requires control letter D)', () => {
      expect(isValidCif('P1234567D')).toBe(true);
      expect(isValidTaxId('P1234567D', 'ES')).toBe(true);
    });

    it('should reject P12345674 (Type P with digit control instead of letter)', () => {
      expect(isValidCif('P12345674')).toBe(false);
      expect(isValidTaxId('P12345674', 'ES')).toBe(false);
    });

    it('should validate mixed types (e.g. Type C allows either digit or letter)', () => {
      // C1234567 has control digit 4 and letter D
      expect(isValidCif('C12345674')).toBe(true);
      expect(isValidCif('C1234567D')).toBe(true);
    });

    it('should reject unknown entity type letter', () => {
      expect(isValidCif('T12345674')).toBe(false); // 'T' is not a valid CIF type
    });
  });

  describe('Input normalization and edge cases', () => {
    it('should handle un-normalized inputs gracefully when called through isValidTaxId', () => {
      expect(isValidTaxId('  b - 12345674 ', 'es')).toBe(true);
      expect(isValidTaxId('12345678-z', 'ES')).toBe(true);
      expect(isValidTaxId('x-1234567-l', 'ES')).toBe(true);
    });
  });

  describe('International tax identifiers (country != ES)', () => {
    it('should accept valid foreign alphanumeric tax IDs between 5 and 20 chars', () => {
      expect(isValidTaxId('DE123456789', 'DE')).toBe(true);
      expect(isValidTaxId('US-EIN-123456', 'US')).toBe(true); // normalized to USEIN123456
      expect(isValidTaxId('GB999999973', 'GB')).toBe(true);
      expect(isValidTaxId('CHE123456789', 'CH')).toBe(true);
    });

    it('should reject foreign tax IDs shorter than 5 chars or containing invalid characters', () => {
      expect(isValidTaxId('A12', 'US')).toBe(false); // too short
      expect(isValidTaxId('INVALID@TAX#', 'FR')).toBe(false); // special characters
    });
  });
});
