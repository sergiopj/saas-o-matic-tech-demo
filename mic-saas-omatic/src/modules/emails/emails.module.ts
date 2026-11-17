import { Module } from '@nestjs/common';
import { EmailController } from './infrastructure/adapters/in/rest/email.controller';
import { SendEmailUseCase } from './application/use-cases/send-email.use-case';
import { HtmlSanitizerService } from './domain/services/html-sanitizer.service';

@Module({
  controllers: [EmailController],
  providers: [HtmlSanitizerService, SendEmailUseCase],
  exports: [SendEmailUseCase],
})
export class EmailsModule {}
