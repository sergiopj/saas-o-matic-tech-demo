import { normalizeTaxId } from '../value-objects/tax-id.vo';

// Modulo 23 control letter sequence for Spanish DNI/NIE
const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

// CIF control letters corresponding to control digits 0-9 (0=J, 1=A, ..., 9=I)
const CIF_CONTROL_LETTERS = 'JABCDEFGHI';

const DNI_REGEX = /^\d{8}[A-Z]$/;
const NIE_REGEX = /^[XYZ]\d{7}[A-Z]$/;
const CIF_REGEX = /^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/;
const INTERNATIONAL_TAX_ID_REGEX = /^[A-Z0-9]{5,20}$/;

// Entities requiring an alphabetical control character (e.g. public bodies, religious orders)
const CIF_STRICTLY_LETTER_TYPES = new Set(['K', 'P', 'Q', 'S']);

// Entities requiring a numeric digit control character (e.g. corporations, partnerships)
const CIF_STRICTLY_DIGIT_TYPES = new Set(['A', 'B', 'E', 'H']);

// Maps the initial foreign letter to its numeric equivalent
const NIE_PREFIX_MAP: Record<string, string> = {
  X: '0',
  Y: '1',
  Z: '2',
};

/**
 * Computes the official DNI/NIE control letter via modulo 23.
 */
function getDniControlLetter(numericPart: number): string {
  return DNI_LETTERS[numericPart % 23] ?? '';
}

/**
 * Validates a Spanish personal national identity document (8 digits + 1 control letter).
 */
export function isValidDni(normalizedId: string): boolean {
  if (!DNI_REGEX.test(normalizedId)) {
    return false;
  }

  const numericPart = Number.parseInt(normalizedId.substring(0, 8), 10);
  const actualLetter = normalizedId.charAt(8);

  return getDniControlLetter(numericPart) === actualLetter;
}

/**
 * Validates a Spanish foreigner identity number (X, Y, or Z followed by 7 digits and a control letter).
 */
export function isValidNie(normalizedId: string): boolean {
  if (!NIE_REGEX.test(normalizedId)) {
    return false;
  }

  // Swap leading letter with its designated digit before running mod 23
  const prefixDigit = NIE_PREFIX_MAP[normalizedId.charAt(0)] ?? '2';
  const numericString = prefixDigit + normalizedId.substring(1, 8);
  const numericPart = Number.parseInt(numericString, 10);
  const actualLetter = normalizedId.charAt(8);

  return getDniControlLetter(numericPart) === actualLetter;
}

interface CifChecksum {
  controlDigit: number;
  controlLetter: string;
}

/**
 * Calculates AEAT control values from the 7-digit body of a CIF.
 */
function calculateCifChecksum(digits: string): CifChecksum {
  // Sum even-indexed positions (1-based positions 2, 4, 6)
  const evenSum =
    Number.parseInt(digits.charAt(1), 10) +
    Number.parseInt(digits.charAt(3), 10) +
    Number.parseInt(digits.charAt(5), 10);

  // Sum odd positions doubled, reducing two-digit products (Luhn-style: 7*2=14 -> 1+4=5)
  let oddSum = 0;
  for (const idx of [0, 2, 4, 6]) {
    const multiplied = Number.parseInt(digits.charAt(idx), 10) * 2;
    oddSum += multiplied > 9 ? multiplied - 9 : multiplied;
  }

  const totalSum = evenSum + oddSum;
  const controlDigit = (10 - (totalSum % 10)) % 10;
  const controlLetter = CIF_CONTROL_LETTERS[controlDigit] ?? '';

  return { controlDigit, controlLetter };
}

/**
 * Verifies whether the control character matches the expected type for the entity letter.
 */
function matchesCifControl(
  firstLetter: string,
  controlChar: string,
  checksum: CifChecksum,
): boolean {
  const { controlDigit, controlLetter } = checksum;

  if (CIF_STRICTLY_LETTER_TYPES.has(firstLetter)) {
    return controlChar === controlLetter;
  }

  if (CIF_STRICTLY_DIGIT_TYPES.has(firstLetter)) {
    return controlChar === controlDigit.toString();
  }

  // Other legal forms (e.g. Cooperatives, LLCs) accept either digit or letter
  return controlChar === controlDigit.toString() || controlChar === controlLetter;
}

/**
 * Validates a Spanish corporate tax identification code (1 entity letter + 7 digits + control).
 */
export function isValidCif(normalizedId: string): boolean {
  if (!CIF_REGEX.test(normalizedId)) {
    return false;
  }

  const firstLetter = normalizedId.charAt(0);
  const digits = normalizedId.substring(1, 8);
  const controlChar = normalizedId.charAt(8);

  const checksum = calculateCifChecksum(digits);
  return matchesCifControl(firstLetter, controlChar, checksum);
}

/**
 * Checks if the identifier matches any valid Spanish tax format (DNI, NIE, or CIF).
 */
function isValidSpanishTaxId(normalizedTaxId: string): boolean {
  return (
    isValidDni(normalizedTaxId) ||
    isValidNie(normalizedTaxId) ||
    isValidCif(normalizedTaxId)
  );
}

/**
 * Checks generic international tax format (5-20 alphanumeric characters).
 */
function isValidInternationalTaxId(normalizedTaxId: string): boolean {
  return INTERNATIONAL_TAX_ID_REGEX.test(normalizedTaxId);
}

/**
 * Main dispatch validator supporting Spanish AEAT algorithms and international IDs.
 */
export function isValidTaxId(rawTaxId: string, country: string): boolean {
  const normalized = normalizeTaxId(rawTaxId);
  const normalizedCountry = country ? country.trim().toUpperCase() : '';

  if (!normalized || !normalizedCountry) {
    return false;
  }

  if (normalizedCountry === 'ES') {
    return isValidSpanishTaxId(normalized);
  }

  return isValidInternationalTaxId(normalized);
}
