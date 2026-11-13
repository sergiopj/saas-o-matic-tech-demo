/**
 * Normalizes a tax identification string by trimming whitespace,
 * converting to uppercase, and removing internal spaces and hyphens.
 *
 * Example: ' b-12345674 ' -> 'B12345674'
 */
export function normalizeTaxId(rawTaxId: string): string {
  if (!rawTaxId || typeof rawTaxId !== 'string') {
    return '';
  }
  return rawTaxId.trim().toUpperCase().replace(/[\s-]/g, '');
}

/**
 * Value Object representing a sanitized Tax Identifier.
 */
export class TaxId {
  private readonly value: string;

  constructor(rawTaxId: string) {
    this.value = normalizeTaxId(rawTaxId);
  }

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: TaxId): boolean {
    return this.value === other.getValue();
  }
}
