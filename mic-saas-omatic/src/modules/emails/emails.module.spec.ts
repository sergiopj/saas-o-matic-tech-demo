import { EmailsModule } from './emails.module';

describe('EmailsModule', () => {
  it('should be defined and instantiable', () => {
    expect(EmailsModule).toBeDefined();
    const module = new EmailsModule();
    expect(module).toBeInstanceOf(EmailsModule);
  });
});
