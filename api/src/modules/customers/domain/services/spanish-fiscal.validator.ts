import { normalizeTaxId } from '../value-objects/tax-id.vo';

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';
const CIF_CONTROL_LETTERS = 'JABCDEFGHI'; // 0=J, 1=A, 2=B, 3=C, 4=D, 5=E, 6=F, 7=G, 8=H, 9=I

/**
 * Validates Spanish DNI (8 digits + 1 control letter with modulo 23).
 */
export function isValidDni(normalizedId: string): boolean {
  const dniRegex = /^\d{8}[A-Z]$/;
  if (!dniRegex.test(normalizedId)) {
    return false;
  }

  const numericPart = parseInt(normalizedId.substring(0, 8), 10);
  const expectedLetter = DNI_LETTERS[numericPart % 23];
  const actualLetter = normalizedId.charAt(8);

  return expectedLetter === actualLetter;
}

/**
 * Validates Spanish NIE (X/Y/Z + 7 digits + 1 control letter with modulo 23).
 * X maps to 0, Y maps to 1, Z maps to 2.
 */
export function isValidNie(normalizedId: string): boolean {
  const nieRegex = /^[XYZ]\d{7}[A-Z]$/;
  if (!nieRegex.test(normalizedId)) {
    return false;
  }

  const prefix = normalizedId.charAt(0);
  const prefixDigit = prefix === 'X' ? '0' : prefix === 'Y' ? '1' : '2';
  const numericString = prefixDigit + normalizedId.substring(1, 8);
  const numericPart = parseInt(numericString, 10);

  const expectedLetter = DNI_LETTERS[numericPart % 23];
  const actualLetter = normalizedId.charAt(8);

  return expectedLetter === actualLetter;
}

/**
 * Validates Spanish CIF (1 entity letter + 7 digits + 1 control digit or letter).
 * Follows the official AEAT algorithmic check:
 * - A: Sum of even positions (d2 + d4 + d6)
 * - B: Sum of digits of (odd positions * 2) (d1, d3, d5, d7)
 * - S = A + B
 * - C = (10 - (S % 10)) % 10
 *
 * Rules:
 * - Types [K, P, Q, S]: strictly letter control.
 * - Types [A, B, E, H]: strictly numerical digit control.
 * - Types [C, D, F, G, J, L, M, N, R, U, V, W]: allows either letter or digit.
 */
export function isValidCif(normalizedId: string): boolean {
  // Types: all letters except I, Ñ, O, T, X, Y, Z
  const cifRegex = /^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/;
  if (!cifRegex.test(normalizedId)) {
    return false;
  }

  const firstLetter = normalizedId.charAt(0);
  const digits = normalizedId.substring(1, 8);
  const controlChar = normalizedId.charAt(8);

  // 1. Sum of even positions (indices 1, 3, 5 corresponding to d2, d4, d6)
  const evenSum =
    parseInt(digits.charAt(1), 10) +
    parseInt(digits.charAt(3), 10) +
    parseInt(digits.charAt(5), 10);

  // 2. Sum of digits of odd positions multiplied by 2 (indices 0, 2, 4, 6 corresponding to d1, d3, d5, d7)
  const oddIndices = [0, 2, 4, 6];
  let oddSum = 0;
  for (const idx of oddIndices) {
    const multiplied = parseInt(digits.charAt(idx), 10) * 2;
    // Sum of digits: for values < 10 it's the value itself; for >= 10 (e.g. 14 -> 1+4 = 5 or multiplied - 9)
    oddSum += multiplied > 9 ? multiplied - 9 : multiplied;
  }

  const totalSum = evenSum + oddSum;
  const controlDigit = (10 - (totalSum % 10)) % 10;
  const controlLetter = CIF_CONTROL_LETTERS[controlDigit];

  // Control letter strictly required
  const strictlyLetterTypes = ['K', 'P', 'Q', 'S'];
  if (strictlyLetterTypes.includes(firstLetter)) {
    return controlChar === controlLetter;
  }

  // Numerical digit strictly required
  const strictlyDigitTypes = ['A', 'B', 'E', 'H'];
  if (strictlyDigitTypes.includes(firstLetter)) {
    return controlChar === controlDigit.toString();
  }

  // Mixed types: allow either corresponding digit or letter
  return controlChar === controlDigit.toString() || controlChar === controlLetter;
}

/**
 * Universal fiscal identifier validator.
 * If country is 'ES', applies strict mathematical check (DNI, NIE, or CIF).
 * If country is foreign, requires clean alphanumeric string between 5 and 20 chars.
 */
export function isValidTaxId(rawTaxId: string, country: string): boolean {
  const normalized = normalizeTaxId(rawTaxId);
  const normalizedCountry = country ? country.trim().toUpperCase() : '';

  if (!normalized || !normalizedCountry) {
    return false;
  }

  if (normalizedCountry === 'ES') {
    return isValidDni(normalized) || isValidNie(normalized) || isValidCif(normalized);
  }

  // Non-Spanish entities: alphanumeric, min 5, max 20 chars
  const internationalRegex = /^[A-Z0-9]{5,20}$/;
  return internationalRegex.test(normalized);
}
