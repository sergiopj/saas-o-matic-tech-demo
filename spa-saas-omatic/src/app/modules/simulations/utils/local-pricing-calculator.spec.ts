import {
  calculateBaseCost,
  resolveTaxRate,
  projectSimulationCost,
} from './local-pricing-calculator';

describe('LocalPricingCalculator', () => {
  describe('calculateBaseCost (Canonical Tiered Pricing Formula)', () => {
    it('should return 0.00 € for 0 users', () => {
      expect(calculateBaseCost(0)).toBe(0);
    });

    it('should return 100.00 € for 10 users (boundary tier 1)', () => {
      expect(calculateBaseCost(10)).toBe(100);
    });

    it('should return 140.00 € for 15 users (official challenge example: 10*10 + 5*8)', () => {
      expect(calculateBaseCost(15)).toBe(140);
    });

    it('should return 420.00 € for 50 users (boundary tier 2: 100 + 40*8)', () => {
      expect(calculateBaseCost(50)).toBe(420);
    });

    it('should return 470.00 € for 60 users (tier 3: 420 + 10*5)', () => {
      expect(calculateBaseCost(60)).toBe(470);
    });

    it('should handle negative numbers gracefully returning 0', () => {
      expect(calculateBaseCost(-5)).toBe(0);
    });
  });

  describe('resolveTaxRate', () => {
    it('should apply 21% VAT for Spain (ES)', () => {
      expect(resolveTaxRate('ES')).toBe(0.21);
      expect(resolveTaxRate('es')).toBe(0.21);
    });

    it('should apply 19% for Germany (DE)', () => {
      expect(resolveTaxRate('DE')).toBe(0.19);
    });

    it('should apply 20% for France (FR)', () => {
      expect(resolveTaxRate('FR')).toBe(0.20);
    });

    it('should apply 22% for Italy (IT)', () => {
      expect(resolveTaxRate('IT')).toBe(0.22);
    });

    it('should apply 20% for United Kingdom (GB)', () => {
      expect(resolveTaxRate('GB')).toBe(0.20);
    });

    it('should apply 0% for United States (US)', () => {
      expect(resolveTaxRate('US')).toBe(0.00);
    });

    it('should apply 0% for other EU countries (reverse charge B2B)', () => {
      expect(resolveTaxRate('PT')).toBe(0.00);
      expect(resolveTaxRate('NL')).toBe(0.00);
    });

    it('should apply 0% for rest of the world', () => {
      expect(resolveTaxRate('JP')).toBe(0.00);
      expect(resolveTaxRate('CA')).toBe(0.00);
    });
  });

  describe('projectSimulationCost', () => {
    it('should project full cost breakdown for 15 Spanish users in EUR', () => {
      const projection = projectSimulationCost(15, 100, 50000, 'ES', 'EUR', 1);

      expect(projection.activeUsers).toBe(15);
      expect(projection.storageGb).toBe(100);
      expect(projection.apiCalls).toBe(50000);
      expect(projection.monthlyBaseCostEur).toBe(140.00);
      expect(projection.taxRate).toBe(0.21);
      expect(projection.taxAmountEur).toBe(29.40);
      expect(projection.totalCostEur).toBe(169.40);
      expect(projection.convertedTotalCost).toBe(169.40);
      expect(projection.targetCurrency).toBe('EUR');
    });

    it('should convert total cost when another currency is selected', () => {
      // 169.40 EUR * 1.08 USD = 182.952 -> 182.95 USD
      const projection = projectSimulationCost(15, 0, 0, 'ES', 'USD', 1.08);

      expect(projection.totalCostEur).toBe(169.40);
      expect(projection.convertedTotalCost).toBe(182.95);
      expect(projection.targetCurrency).toBe('USD');
    });
  });
});
