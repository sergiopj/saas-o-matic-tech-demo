import { SimulationsModule } from './simulations.module';

describe('SimulationsModule', () => {
  it('should be defined and instantiable', () => {
    expect(SimulationsModule).toBeDefined();
    const module = new SimulationsModule();
    expect(module).toBeInstanceOf(SimulationsModule);
  });
});
