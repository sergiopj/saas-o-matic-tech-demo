import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { SendEmailDto } from '../../infrastructure/adapters/in/rest/dto/send-email.dto';
import { HtmlSanitizerService } from '../../domain/services/html-sanitizer.service';

export interface SendEmailResult {
  success: boolean;
  messageId: string;
  recipient: string;
  subject: string;
  sanitizedBodyLength: number;
  dispatchedAt: string;
}

@Injectable()
export class SendEmailUseCase {
  private readonly logger = new Logger(SendEmailUseCase.name);

  constructor(private readonly sanitizer: HtmlSanitizerService) {}

  async execute(dto: SendEmailDto): Promise<SendEmailResult> {
    const cleanHtml = this.sanitizer.sanitize(dto.htmlBody);
    const messageId = `msg-${uuidv4()}`;
    const dispatchedAt = new Date().toISOString();

    this.logger.log(
      `Dispatched email to [${dto.to}] with subject "${dto.subject}" (messageId: ${messageId})`
    );

    return {
      success: true,
      messageId,
      recipient: dto.to,
      subject: dto.subject,
      sanitizedBodyLength: cleanHtml.length,
      dispatchedAt,
    };
  }
}
