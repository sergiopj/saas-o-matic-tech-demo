import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const CIF_CONTROL_LETTERS = 'JABCDEFGHI';

/**
 * Normalizes tax identifier by stripping whitespace, hyphens, and converting to uppercase.
 */
export function normalizeTaxId(value: string | null | undefined): string {
  if (!value) return '';
  return value.trim().toUpperCase().replace(/[\s-]/g, '');
}

/**
 * Validates Spanish DNI (8 digits + 1 control letter with modulo 23).
 */
export function isValidDni(normalized: string): boolean {
  if (!/^\d{8}[A-Z]$/.test(normalized)) {
    return false;
  }
  const numericPart = parseInt(normalized.substring(0, 8), 10);
  const expectedLetter = DNI_LETTERS[numericPart % 23];
  return expectedLetter === normalized.charAt(8);
}

/**
 * Validates Spanish NIE (X/Y/Z + 7 digits + 1 control letter with modulo 23).
 */
export function isValidNie(normalized: string): boolean {
  if (!/^[XYZ]\d{7}[A-Z]$/.test(normalized)) {
    return false;
  }
  const prefix = normalized.charAt(0);
  const prefixDigit = prefix === 'X' ? '0' : prefix === 'Y' ? '1' : '2';
  const numericString = prefixDigit + normalized.substring(1, 8);
  const numericPart = parseInt(numericString, 10);
  const expectedLetter = DNI_LETTERS[numericPart % 23];
  return expectedLetter === normalized.charAt(8);
}

/**
 * Validates Spanish CIF (1 entity letter + 7 digits + 1 control digit or letter).
 * Follows the official AEAT algorithmic check.
 */
export function isValidCif(normalized: string): boolean {
  if (!/^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/.test(normalized)) {
    return false;
  }

  const firstLetter = normalized.charAt(0);
  const digits = normalized.substring(1, 8);
  const controlChar = normalized.charAt(8);

  const evenSum =
    parseInt(digits.charAt(1), 10) +
    parseInt(digits.charAt(3), 10) +
    parseInt(digits.charAt(5), 10);

  const oddIndices = [0, 2, 4, 6];
  let oddSum = 0;
  for (const idx of oddIndices) {
    const multiplied = parseInt(digits.charAt(idx), 10) * 2;
    oddSum += multiplied > 9 ? multiplied - 9 : multiplied;
  }

  const totalSum = evenSum + oddSum;
  const controlDigit = (10 - (totalSum % 10)) % 10;
  const controlLetter = CIF_CONTROL_LETTERS[controlDigit];

  const strictlyLetterTypes = ['K', 'P', 'Q', 'S'];
  if (strictlyLetterTypes.includes(firstLetter)) {
    return controlChar === controlLetter;
  }

  const strictlyDigitTypes = ['A', 'B', 'E', 'H'];
  if (strictlyDigitTypes.includes(firstLetter)) {
    return controlChar === controlDigit.toString();
  }

  return controlChar === controlDigit.toString() || controlChar === controlLetter;
}

/**
 * Universal fiscal ID check for Spanish or International entities.
 */
export function isValidTaxId(taxId: string, country: string): boolean {
  const normalized = normalizeTaxId(taxId);
  const normalizedCountry = (country || '').trim().toUpperCase();

  if (!normalized || !normalizedCountry) {
    return false;
  }

  if (normalizedCountry === 'ES') {
    return isValidDni(normalized) || isValidNie(normalized) || isValidCif(normalized);
  }

  return /^[A-Z0-9]{5,20}$/.test(normalized);
}

/**
 * Angular reactive forms validator function for Spanish and international Tax IDs.
 */
export function fiscalTaxIdValidator(getCountry: () => string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || typeof value !== 'string') {
      return null;
    }

    const country = getCountry();
    const valid = isValidTaxId(value, country);
    if (valid) {
      return null;
    }

    const normalizedCountry = (country || '').trim().toUpperCase();
    return normalizedCountry === 'ES'
      ? { invalidTaxId: true, invalidSpanishTaxId: true }
      : { invalidTaxId: true, invalidInternationalTaxId: true };
  };
}

/**
 * RFC 5322 compliant email validator with mandatory TLD of at least 2 characters.
 */
export function rfc5322EmailValidator(): ValidatorFn {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value || typeof value !== 'string') {
      return null;
    }
    return emailRegex.test(value.trim()) ? null : { invalidEmailFormat: true };
  };
}
