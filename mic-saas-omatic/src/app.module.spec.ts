import { AppModule } from './app.module';

describe('AppModule', () => {
  it('should be defined and instantiable', () => {
    expect(AppModule).toBeDefined();
    const module = new AppModule();
    expect(module).toBeInstanceOf(AppModule);
  });
});
