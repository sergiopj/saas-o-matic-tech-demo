import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from './error.interceptor';
import { ProblemDetail } from './problem-detail.model';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should forward structured ProblemDetail from backend response directly', () => {
    const backendProblem: ProblemDetail = {
      type: 'https://errors.saas-o-matic.com/400',
      title: 'Bad Request',
      status: 400,
      detail: 'Invalid CIF format',
      instance: '/customers',
      timestamp: '2026-11-13T10:00:00.000Z',
    };

    let caughtError: ProblemDetail | undefined;

    http.get('/test-endpoint').subscribe({
      next: () => {
        throw new Error('should have failed');
      },
      error: (err: ProblemDetail) => {
        caughtError = err;
      },
    });

    const req = httpTesting.expectOne('/test-endpoint');
    req.flush(backendProblem, { status: 400, statusText: 'Bad Request' });

    expect(caughtError).toEqual(backendProblem);
  });

  it('should transform network or non-JSON errors into a normalized about:blank ProblemDetail', () => {
    let caughtError: ProblemDetail | undefined;

    http.get('/offline-endpoint').subscribe({
      next: () => {
        throw new Error('should have failed');
      },
      error: (err: ProblemDetail) => {
        caughtError = err;
      },
    });

    const req = httpTesting.expectOne('/offline-endpoint');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(caughtError).toBeDefined();
    expect(caughtError?.type).toBe('about:blank');
    expect(caughtError?.title).toBe('Communication Error');
    expect(caughtError?.detail).toBe('An unexpected error occurred while communicating with the server.');
    expect(caughtError?.instance).toBe('/offline-endpoint');
  });
});
