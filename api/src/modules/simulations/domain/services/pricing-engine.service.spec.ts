import { calculateTieredPrice } from './pricing-engine.service';
import { DomainError } from '../../../../shared/domain/domain.exception';

describe('PricingEngineService (Tiered Pricing Domain Algorithm)', () => {
  describe('Tier 1: 0 to 10 users (10.00 € / user)', () => {
    it('should calculate 0.00 € for 0 users', () => {
      expect(calculateTieredPrice(0)).toBe(0);
    });

    it('should calculate 10.00 € for 1 user', () => {
      expect(calculateTieredPrice(1)).toBe(10);
    });

    it('should calculate 100.00 € for 10 users (boundary)', () => {
      expect(calculateTieredPrice(10)).toBe(100);
    });
  });

  describe('Tier 2: 11 to 50 users (8.00 € / user for users exceeding 10)', () => {
    it('should calculate 108.00 € for 11 users (10*10 + 1*8)', () => {
      expect(calculateTieredPrice(11)).toBe(108);
    });

    it('should calculate 140.00 € for 15 users (canonical Word challenge example)', () => {
      // 10 users * 10€ + 5 users * 8€ = 100€ + 40€ = 140€
      expect(calculateTieredPrice(15)).toBe(140);
    });

    it('should calculate 420.00 € for 50 users (boundary: 10*10 + 40*8)', () => {
      expect(calculateTieredPrice(50)).toBe(420);
    });
  });

  describe('Tier 3: > 50 users (5.00 € / user for users exceeding 50)', () => {
    it('should calculate 425.00 € for 51 users (420 + 1*5)', () => {
      expect(calculateTieredPrice(51)).toBe(425);
    });

    it('should calculate 470.00 € for 60 users (420 + 10*5)', () => {
      expect(calculateTieredPrice(60)).toBe(470);
    });

    it('should calculate 670.00 € for 100 users (420 + 50*5)', () => {
      expect(calculateTieredPrice(100)).toBe(670);
    });
  });

  describe('Validation & Invariants', () => {
    it('should throw DomainError for negative activeUsers', () => {
      expect(() => calculateTieredPrice(-1)).toThrow(DomainError);
    });

    it('should throw DomainError for non-integer numbers', () => {
      expect(() => calculateTieredPrice(5.5)).toThrow(DomainError);
    });

    it('should throw DomainError for null or undefined', () => {
      // @ts-expect-error testing invalid input
      expect(() => calculateTieredPrice(null)).toThrow(DomainError);
      // @ts-expect-error testing invalid input
      expect(() => calculateTieredPrice(undefined)).toThrow(DomainError);
    });
  });
});
