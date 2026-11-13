import { Simulation } from './simulation.entity';
import { DomainError } from '../../../../shared/domain/domain.exception';

describe('Simulation Domain Entity (Pure TypeScript)', () => {
  const fakeId = 'simulation-uuid-1';
  const fakeCustomerId = 'customer-uuid-1';
  const idGenerator = () => fakeId;

  describe('create', () => {
    it('should create a simulation for Spanish customer with 21% VAT', () => {
      // 15 users: 10*10 + 5*8 = 140 base; 140 * 0.21 = 29.40 tax; total = 169.40
      const simulation = Simulation.create(
        {
          customerId: fakeCustomerId,
          customerCountry: 'ES',
          activeUsers: 15,
          storageGb: 50,
          apiCalls: 10000,
        },
        idGenerator,
      );

      expect(simulation.getId()).toBe(fakeId);
      expect(simulation.getCustomerId()).toBe(fakeCustomerId);
      expect(simulation.getActiveUsers()).toBe(15);
      expect(simulation.getStorageGb()).toBe(50);
      expect(simulation.getApiCalls()).toBe(10000);
      expect(simulation.getMonthlyBaseCost()).toBe(140);
      expect(simulation.getTaxRate()).toBe(0.21);
      expect(simulation.getTaxAmount()).toBe(29.40);
      expect(simulation.getTotalCost()).toBe(169.40);
      expect(simulation.getCurrency()).toBe('EUR');
      expect(simulation.getCreatedAt()).toBeInstanceOf(Date);
    });

    it('should create a simulation for German customer with 19% VAT', () => {
      // 50 users: 10*10 + 40*8 = 420 base; 420 * 0.19 = 79.80 tax; total = 499.80
      const simulation = Simulation.create(
        {
          customerId: fakeCustomerId,
          customerCountry: 'DE',
          activeUsers: 50,
          storageGb: 200,
          apiCalls: 50000,
        },
        idGenerator,
      );

      expect(simulation.getMonthlyBaseCost()).toBe(420);
      expect(simulation.getTaxRate()).toBe(0.19);
      expect(simulation.getTaxAmount()).toBe(79.80);
      expect(simulation.getTotalCost()).toBe(499.80);
    });

    it('should create a simulation for US customer with 0% tax', () => {
      const simulation = Simulation.create(
        {
          customerId: fakeCustomerId,
          customerCountry: 'US',
          activeUsers: 10,
          storageGb: 10,
          apiCalls: 1000,
        },
        idGenerator,
      );

      expect(simulation.getMonthlyBaseCost()).toBe(100);
      expect(simulation.getTaxRate()).toBe(0);
      expect(simulation.getTaxAmount()).toBe(0);
      expect(simulation.getTotalCost()).toBe(100);
    });

    it('should handle zero active users as valid minimum boundary', () => {
      const simulation = Simulation.create(
        {
          customerId: fakeCustomerId,
          customerCountry: 'ES',
          activeUsers: 0,
          storageGb: 0,
          apiCalls: 0,
        },
        idGenerator,
      );

      expect(simulation.getMonthlyBaseCost()).toBe(0);
      expect(simulation.getTaxAmount()).toBe(0);
      expect(simulation.getTotalCost()).toBe(0);
    });

    it('should throw DomainError when customerId is empty', () => {
      expect(() =>
        Simulation.create(
          {
            customerId: '   ',
            customerCountry: 'ES',
            activeUsers: 10,
            storageGb: 10,
            apiCalls: 100,
          },
          idGenerator,
        ),
      ).toThrow(DomainError);
    });

    it('should throw DomainError when customerCountry is invalid', () => {
      expect(() =>
        Simulation.create(
          {
            customerId: fakeCustomerId,
            customerCountry: 'ESP',
            activeUsers: 10,
            storageGb: 10,
            apiCalls: 100,
          },
          idGenerator,
        ),
      ).toThrow(DomainError);
    });

    it('should throw DomainError when activeUsers is negative or not integer', () => {
      expect(() =>
        Simulation.create(
          {
            customerId: fakeCustomerId,
            customerCountry: 'ES',
            activeUsers: -5,
            storageGb: 10,
            apiCalls: 100,
          },
          idGenerator,
        ),
      ).toThrow(DomainError);

      expect(() =>
        Simulation.create(
          {
            customerId: fakeCustomerId,
            customerCountry: 'ES',
            activeUsers: 5.5,
            storageGb: 10,
            apiCalls: 100,
          },
          idGenerator,
        ),
      ).toThrow(DomainError);
    });

    it('should throw DomainError when storageGb is negative', () => {
      expect(() =>
        Simulation.create(
          {
            customerId: fakeCustomerId,
            customerCountry: 'ES',
            activeUsers: 10,
            storageGb: -1,
            apiCalls: 100,
          },
          idGenerator,
        ),
      ).toThrow(DomainError);
    });

    it('should throw DomainError when apiCalls is negative or not integer', () => {
      expect(() =>
        Simulation.create(
          {
            customerId: fakeCustomerId,
            customerCountry: 'ES',
            activeUsers: 10,
            storageGb: 10,
            apiCalls: -10,
          },
          idGenerator,
        ),
      ).toThrow(DomainError);

      expect(() =>
        Simulation.create(
          {
            customerId: fakeCustomerId,
            customerCountry: 'ES',
            activeUsers: 10,
            storageGb: 10,
            apiCalls: 10.5,
          },
          idGenerator,
        ),
      ).toThrow(DomainError);
    });
  });

  describe('reconstitute & toJSON', () => {
    it('should reconstitute a simulation without recalculation', () => {
      const fixedDate = new Date('2026-06-15T12:00:00.000Z');
      const props = {
        id: 'persisted-sim-1',
        customerId: fakeCustomerId,
        activeUsers: 25,
        storageGb: 100,
        apiCalls: 20000,
        monthlyBaseCost: 220,
        taxRate: 0.21,
        taxAmount: 46.20,
        totalCost: 266.20,
        currency: 'EUR',
        createdAt: fixedDate,
      };

      const simulation = Simulation.reconstitute(props);

      expect(simulation.getId()).toBe('persisted-sim-1');
      expect(simulation.getCreatedAt()).toBe(fixedDate);
      expect(simulation.toJSON()).toEqual(props);
    });
  });
});
