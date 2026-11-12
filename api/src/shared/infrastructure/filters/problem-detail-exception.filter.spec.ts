import { ProblemDetailExceptionFilter } from './problem-detail-exception.filter';
import { ArgumentsHost, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import {
  DomainError,
  EntityNotFoundError,
  ConflictError,
} from '../../domain/domain.exception';

describe('ProblemDetailExceptionFilter (RFC 7807)', () => {
  let filter: ProblemDetailExceptionFilter;
  let mockResponse: {
    status: jest.Mock;
    header: jest.Mock;
    json: jest.Mock;
  };
  let mockRequest: { url: string };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new ProblemDetailExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = { url: '/customers' };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should transform EntityNotFoundError into 404 Problem Details', () => {
    const error = new EntityNotFoundError('Customer', '123');

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockResponse.header).toHaveBeenCalledWith(
      'Content-Type',
      'application/problem+json',
    );
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 404,
        title: 'Not Found',
        detail: "Customer with id '123' was not found.",
        instance: '/customers',
      }),
    );
  });

  it('should transform ConflictError into 409 Problem Details', () => {
    const error = new ConflictError('TaxId B12345674 already exists');

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 409,
        title: 'Conflict',
        detail: 'TaxId B12345674 already exists',
      }),
    );
  });

  it('should transform DomainError into 400 Problem Details', () => {
    const error = new DomainError('Invalid fiscal checksum');

    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        title: 'Bad Request',
        detail: 'Invalid fiscal checksum',
      }),
    );
  });

  it('should format class-validator BadRequestException with invalidParams array', () => {
    const validationError = new BadRequestException({
      error: 'Bad Request',
      message: ['email must be an email', 'country must be a valid 2-letter ISO code.'],
    });

    filter.catch(validationError, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        invalidParams: expect.arrayContaining([
          expect.objectContaining({ name: 'email' }),
          expect.objectContaining({ name: 'country' }),
        ]),
      }),
    );
  });

  it('should properly set title and detail when HttpException response is a string', () => {
    const stringError = new HttpException('Forbidden resource', HttpStatus.FORBIDDEN);

    filter.catch(stringError, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 403,
        title: 'HttpException',
        detail: 'Forbidden resource',
      }),
    );
  });

  it('should not leak internal error message on 500 error', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const unexpectedError = new Error('SQLite database table locked internal secret');

    filter.catch(unexpectedError, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 500,
        title: 'Internal Server Error',
        detail: 'An unexpected error occurred.',
      }),
    );
    consoleSpy.mockRestore();
  });
});
