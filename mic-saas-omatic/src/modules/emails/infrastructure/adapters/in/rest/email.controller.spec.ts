import { Test, TestingModule } from '@nestjs/testing';
import { EmailController } from './email.controller';
import { SendEmailUseCase } from '../../../../application/use-cases/send-email.use-case';
import { HtmlSanitizerService } from '../../../../domain/services/html-sanitizer.service';
import { SendEmailDto } from './dto/send-email.dto';

describe('EmailController', () => {
  let controller: EmailController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailController],
      providers: [HtmlSanitizerService, SendEmailUseCase],
    }).compile();

    controller = module.get<EmailController>(EmailController);
  });

  it('should dispatch email payload via use case', async () => {
    const dto: SendEmailDto = {
      to: 'sales@enterprise.com',
      subject: 'Quarterly Proposal',
      htmlBody: '<p><b>Proposal</b></p>',
    };

    const res = await controller.sendEmail(dto);

    expect(res.success).toBe(true);
    expect(res.recipient).toBe('sales@enterprise.com');
  });
});
