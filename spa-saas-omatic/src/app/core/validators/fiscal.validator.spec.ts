import { FormControl } from '@angular/forms';
import {
  isValidCif,
  isValidDni,
  isValidNie,
  isValidTaxId,
  normalizeTaxId,
  fiscalTaxIdValidator,
  rfc5322EmailValidator,
} from './fiscal.validator';

describe('Fiscal Validator (AEAT Algorithm)', () => {
  describe('normalizeTaxId', () => {
    it('should return empty string for null, undefined, or empty input', () => {
      expect(normalizeTaxId(null)).toBe('');
      expect(normalizeTaxId(undefined)).toBe('');
      expect(normalizeTaxId('')).toBe('');
    });

    it('should strip whitespace and hyphens, and convert to uppercase', () => {
      expect(normalizeTaxId(' b-123 456-74 ')).toBe('B12345674');
    });
  });

  describe('Spanish DNI, NIE and CIF validation', () => {
    it('should validate correct DNI', () => {
      // 12345678Z: 12345678 % 23 = 14 -> Z
      expect(isValidDni('12345678Z')).toBe(true);
      expect(isValidDni('12345678A')).toBe(false);
      expect(isValidDni('short')).toBe(false);
    });

    it('should validate correct NIE (X, Y, Z prefixes)', () => {
      expect(isValidNie('X1234567L')).toBe(true);
      expect(isValidNie('X0000000T')).toBe(true);
      expect(isValidNie('A1234567B')).toBe(false);
      expect(isValidNie('X1234567A')).toBe(false);
    });

    it('should validate official AEAT CIFs', () => {
      expect(isValidCif('B12345674')).toBe(true);
      expect(isValidCif('A28010833')).toBe(true);
      expect(isValidCif('B87654323')).toBe(true);
      expect(isValidCif('B98971237')).toBe(true);
      expect(isValidCif('B12345678')).toBe(false); // invalid control
      expect(isValidCif('INVALID')).toBe(false);
    });

    it('should validate strictly letter CIF types (K, P, Q, S)', () => {
      // Let's test non-digit control requirement
      expect(isValidCif('P2800000A')).toBe(false); // invalid
    });
  });

  describe('isValidTaxId', () => {
    it('should return false for empty taxId or country', () => {
      expect(isValidTaxId('', 'ES')).toBe(false);
      expect(isValidTaxId('B12345674', '')).toBe(false);
    });

    it('should delegate to Spanish validation when country is ES', () => {
      expect(isValidTaxId('B12345674', 'ES')).toBe(true);
      expect(isValidTaxId('B12345679', 'ES')).toBe(false);
    });

    it('should check alphanumeric 5-20 characters for international countries', () => {
      expect(isValidTaxId('DE999888777', 'DE')).toBe(true);
      expect(isValidTaxId('123456789', 'US')).toBe(true);
      expect(isValidTaxId('AB', 'US')).toBe(false); // too short
      expect(isValidTaxId('A'.repeat(25), 'US')).toBe(false); // too long
      expect(isValidTaxId('DE@!#$', 'DE')).toBe(false); // invalid chars
    });
  });

  describe('Angular Validators', () => {
    describe('fiscalTaxIdValidator', () => {
      it('should return null for empty or non-string control values', () => {
        const validator = fiscalTaxIdValidator(() => 'ES');
        expect(validator(new FormControl(''))).toBeNull();
        expect(validator(new FormControl(null))).toBeNull();
      });

      it('should validate valid Spanish CIF', () => {
        const validator = fiscalTaxIdValidator(() => 'ES');
        expect(validator(new FormControl('B12345674'))).toBeNull();
      });

      it('should return invalidTaxId error for invalid Spanish CIF', () => {
        const validator = fiscalTaxIdValidator(() => 'ES');
        expect(validator(new FormControl('B12345678'))).toEqual({ invalidTaxId: true });
      });

      it('should adapt validation based on dynamic country getter', () => {
        let country = 'ES';
        const validator = fiscalTaxIdValidator(() => country);

        // International ID fails under ES
        expect(validator(new FormControl('DE999888777'))).toEqual({ invalidTaxId: true });

        // International ID passes under DE
        country = 'DE';
        expect(validator(new FormControl('DE999888777'))).toBeNull();
      });
    });

    describe('rfc5322EmailValidator', () => {
      const validator = rfc5322EmailValidator();

      it('should return null for empty or non-string values', () => {
        expect(validator(new FormControl(''))).toBeNull();
        expect(validator(new FormControl(null))).toBeNull();
      });

      it('should accept valid RFC 5322 emails with 2+ char TLD', () => {
        expect(validator(new FormControl('billing@roams.es'))).toBeNull();
        expect(validator(new FormControl('finance.ops@company.co.uk'))).toBeNull();
      });

      it('should reject invalid emails or 1-char TLD', () => {
        expect(validator(new FormControl('invalid-email'))).toEqual({ invalidEmailFormat: true });
        expect(validator(new FormControl('user@domain.c'))).toEqual({ invalidEmailFormat: true });
        expect(validator(new FormControl('user@domain'))).toEqual({ invalidEmailFormat: true });
      });
    });
  });
});
