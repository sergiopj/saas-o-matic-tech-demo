import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  DomainError,
  EntityNotFoundError,
  ConflictError,
} from '../../domain/domain.exception';

@Catch()
export class ProblemDetailExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = 'Internal Server Error';
    let detail = 'An unexpected error occurred.';
    let invalidParams: Array<{ name: string; reason: string }> | undefined = undefined;

    if (exception instanceof EntityNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      title = 'Not Found';
      detail = exception.message;
    } else if (exception instanceof ConflictError) {
      status = HttpStatus.CONFLICT;
      title = 'Conflict';
      detail = exception.message;
    } else if (exception instanceof DomainError) {
      status = HttpStatus.BAD_REQUEST;
      title = 'Bad Request';
      detail = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        title = exception.name;
        detail = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        title = (resp.error as string) || exception.name;
        if (Array.isArray(resp.message)) {
          detail = 'Validation failed for one or more fields.';
          invalidParams = resp.message.map((msg: string) => {
            const firstWord = msg.split(' ')[0] || 'field';
            return { name: firstWord, reason: msg };
          });
        } else {
          detail = (resp.message as string) || exception.message;
        }
      }
    } else {
      // 500: Do not leak internal database/system errors to clients; log internally
      console.error('Unhandled internal server error:', exception);
      detail = 'An unexpected error occurred.';
    }

    response
      .status(status)
      .header('Content-Type', 'application/problem+json')
      .json({
        type: `https://errors.saas-o-matic.com/${status}`,
        title,
        status,
        detail,
        instance: request.url,
        ...(invalidParams ? { invalidParams } : {}),
        timestamp: new Date().toISOString(),
      });
  }
}
