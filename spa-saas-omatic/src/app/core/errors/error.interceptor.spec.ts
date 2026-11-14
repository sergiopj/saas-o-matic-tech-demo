import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from './error.interceptor';
import { ProblemDetail } from './problem-detail.model';
import { I18nService } from '../services/i18n.service';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let i18nService: I18nService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    i18nService = TestBed.inject(I18nService);
    i18nService.setLanguage('es');
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should forward structured client ProblemDetail (4xx) directly', () => {
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

  it('should mask 500 server errors with empathetic localized copy', () => {
    let caughtError: ProblemDetail | undefined;

    http.get('/crash-endpoint').subscribe({
      next: () => {
        throw new Error('should have failed');
      },
      error: (err: ProblemDetail) => {
        caughtError = err;
      },
    });

    const req = httpTesting.expectOne('/crash-endpoint');
    req.flush({ message: 'Internal SQL syntax error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(caughtError).toBeDefined();
    expect(caughtError?.status).toBe(500);
    expect(caughtError?.title).toBe(i18nService.t('error.communication.title'));
    expect(caughtError?.detail).toBe(i18nService.t('error.communication.detail'));
    expect(caughtError?.instance).toBe('/crash-endpoint');
  });

  it('should transform network drops (status 0) into a normalized empathetic ProblemDetail', () => {
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
    expect(caughtError?.status).toBeUndefined();
    expect(caughtError?.title).toBe(i18nService.t('error.communication.title'));
    expect(caughtError?.detail).toBe(i18nService.t('error.communication.detail'));
    expect(caughtError?.instance).toBe('/offline-endpoint');
  });
});
