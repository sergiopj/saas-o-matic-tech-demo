import { getTaxRate, calculateTaxBreakdown } from './tax-calculator.service';
import { DomainError } from '../../../../shared/domain/domain.exception';

describe('TaxCalculatorService', () => {
  describe('getTaxRate', () => {
    it('should return 0.21 for Spain (ES)', () => {
      expect(getTaxRate('ES')).toBe(0.21);
    });

    it('should return 0.19 for Germany (DE)', () => {
      expect(getTaxRate('DE')).toBe(0.19);
    });

    it('should return 0.20 for France (FR)', () => {
      expect(getTaxRate('FR')).toBe(0.20);
    });

    it('should return 0.22 for Italy (IT)', () => {
      expect(getTaxRate('IT')).toBe(0.22);
    });

    it('should return 0.20 for United Kingdom (GB)', () => {
      expect(getTaxRate('GB')).toBe(0.20);
    });

    it('should return 0.00 for United States (US)', () => {
      expect(getTaxRate('US')).toBe(0);
    });

    it('should return 0.00 for EU countries under reverse charge B2B rule', () => {
      expect(getTaxRate('PL')).toBe(0);
      expect(getTaxRate('PT')).toBe(0);
      expect(getTaxRate('NL')).toBe(0);
    });

    it('should return 0.00 for non-EU countries', () => {
      expect(getTaxRate('JP')).toBe(0);
      expect(getTaxRate('BR')).toBe(0);
      expect(getTaxRate('AU')).toBe(0);
    });

    it('should normalize country code (case insensitive and whitespace)', () => {
      expect(getTaxRate('es')).toBe(0.21);
      expect(getTaxRate('  de  ')).toBe(0.19);
    });

    it('should return 0.00 for empty or unknown country code', () => {
      expect(getTaxRate('')).toBe(0);
      expect(getTaxRate('UNKNOWN')).toBe(0);
    });
  });

  describe('calculateTaxBreakdown', () => {
    it('should calculate 21% VAT for Spanish customer', () => {
      const result = calculateTaxBreakdown(100, 0.21);
      expect(result.taxRate).toBe(0.21);
      expect(result.taxAmount).toBe(21);
      expect(result.totalCost).toBe(121);
    });

    it('should calculate 19% VAT for German customer', () => {
      const result = calculateTaxBreakdown(420, 0.19);
      expect(result.taxRate).toBe(0.19);
      expect(result.taxAmount).toBe(79.80);
      expect(result.totalCost).toBe(499.80);
    });

    it('should return total equal to base cost when tax rate is 0%', () => {
      const result = calculateTaxBreakdown(140, 0);
      expect(result.taxRate).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.totalCost).toBe(140);
    });

    it('should round tax amount and total to two decimal places', () => {
      const result = calculateTaxBreakdown(140, 0.22);
      expect(result.taxAmount).toBe(30.80);
      expect(result.totalCost).toBe(170.80);
    });

    it('should handle zero base cost', () => {
      const result = calculateTaxBreakdown(0, 0.21);
      expect(result.taxAmount).toBe(0);
      expect(result.totalCost).toBe(0);
    });

    it('should throw DomainError when base cost is negative', () => {
      expect(() => calculateTaxBreakdown(-10, 0.21)).toThrow(DomainError);
    });

    it('should throw DomainError when tax rate is negative', () => {
      expect(() => calculateTaxBreakdown(100, -0.05)).toThrow(DomainError);
    });
  });
});
