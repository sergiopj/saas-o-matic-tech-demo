import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SendEmailDto } from './dto/send-email.dto';
import type { SendEmailResult } from '../../../../application/use-cases/send-email.use-case';
import { SendEmailUseCase } from '../../../../application/use-cases/send-email.use-case';

@ApiTags('Emails')
@Controller('emails')
export class EmailController {
  constructor(private readonly sendEmailUseCase: SendEmailUseCase) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dispatch transactional or commercial email with rich HTML content',
  })
  @ApiResponse({
    status: 200,
    description: 'Email successfully processed, sanitized, and dispatched',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email payload or malformed recipient address',
  })
  async sendEmail(@Body() dto: SendEmailDto): Promise<SendEmailResult> {
    return this.sendEmailUseCase.execute(dto);
  }
}
