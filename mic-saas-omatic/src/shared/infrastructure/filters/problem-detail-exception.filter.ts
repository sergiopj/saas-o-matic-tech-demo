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

interface ProblemDetailPayload {
  status: number;
  title: string;
  detail: string;
  invalidParams?: Array<{ name: string; reason: string }>;
}

@Catch()
export class ProblemDetailExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const problem = resolveProblemDetail(exception);

    response
      .status(problem.status)
      .header('Content-Type', 'application/problem+json')
      .json({
        type: `https://errors.saas-o-matic.com/${problem.status}`,
        title: problem.title,
        status: problem.status,
        detail: problem.detail,
        instance: request.url,
        ...(problem.invalidParams ? { invalidParams: problem.invalidParams } : {}),
        timestamp: new Date().toISOString(),
      });
  }
}

function resolveProblemDetail(exception: unknown): ProblemDetailPayload {
  if (exception instanceof EntityNotFoundError) {
    return {
      status: HttpStatus.NOT_FOUND,
      title: 'Not Found',
      detail: exception.message,
    };
  }

  if (exception instanceof ConflictError) {
    return {
      status: HttpStatus.CONFLICT,
      title: 'Conflict',
      detail: exception.message,
    };
  }

  if (exception instanceof DomainError) {
    return {
      status: HttpStatus.BAD_REQUEST,
      title: 'Bad Request',
      detail: exception.message,
    };
  }

  if (exception instanceof HttpException) {
    return parseHttpException(exception);
  }

  return handleUnexpectedError(exception);
}

function parseHttpException(exception: HttpException): ProblemDetailPayload {
  const status = exception.getStatus();
  const response = exception.getResponse();

  if (typeof response === 'string') {
    return {
      status,
      title: exception.name,
      detail: response,
    };
  }

  if (typeof response === 'object' && response !== null) {
    const payload = response as Record<string, unknown>;
    const title = (payload.error as string) || exception.name;

    if (Array.isArray(payload.message)) {
      return {
        status,
        title,
        detail: 'Validation failed for one or more fields.',
        invalidParams: extractInvalidParams(payload.message),
      };
    }

    return {
      status,
      title,
      detail: (payload.message as string) || exception.message,
    };
  }

  return {
    status,
    title: exception.name,
    detail: exception.message,
  };
}

function extractInvalidParams(messages: unknown[]): Array<{ name: string; reason: string }> {
  return messages.map((msg) => {
    const text = String(msg);
    return {
      name: text.split(' ')[0] || 'field',
      reason: text,
    };
  });
}

function handleUnexpectedError(exception: unknown): ProblemDetailPayload {
  // 500: Log internal errors without leaking database or system details to clients (OWASP A05)
  console.error('Unhandled internal server error:', exception);
  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    title: 'Internal Server Error',
    detail: 'An unexpected internal error occurred. Please try again shortly or contact support.',
  };
}
