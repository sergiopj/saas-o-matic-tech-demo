import { CustomersModule } from './customers.module';

describe('CustomersModule', () => {
  it('should be defined and instantiable', () => {
    expect(CustomersModule).toBeDefined();
    const module = new CustomersModule();
    expect(module).toBeInstanceOf(CustomersModule);
  });
});
