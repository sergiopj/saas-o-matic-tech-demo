import { SendEmailUseCase } from './send-email.use-case';
import { HtmlSanitizerService } from '../../domain/services/html-sanitizer.service';
import { SendEmailDto } from '../../infrastructure/adapters/in/rest/dto/send-email.dto';

describe('SendEmailUseCase', () => {
  let useCase: SendEmailUseCase;
  let sanitizer: HtmlSanitizerService;

  beforeEach(() => {
    sanitizer = new HtmlSanitizerService();
    useCase = new SendEmailUseCase(sanitizer);
  });

  it('should execute and return dispatch confirmation with messageId', async () => {
    const dto: SendEmailDto = {
      to: 'billing@acme.com',
      subject: 'Commercial Proposal',
      htmlBody: '<p>Offer details</p>',
    };

    const result = await useCase.execute(dto);

    expect(result.success).toBe(true);
    expect(result.recipient).toBe('billing@acme.com');
    expect(result.subject).toBe('Commercial Proposal');
    expect(result.messageId).toMatch(/^msg-[a-f0-9-]+$/);
    expect(result.dispatchedAt).toBeDefined();
  });
});
