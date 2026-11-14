import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CustomerApiService } from './customer-api.service';
import { Customer, CustomerCreate } from '../models/customer.model';
import { ProblemDetail } from '../../../core/errors/problem-detail.model';
import { errorInterceptor } from '../../../core/errors/error.interceptor';
import { I18nService } from '../../../core/services/i18n.service';
import { environment } from '../../../../environments/environment';

describe('CustomerApiService', () => {
  let service: CustomerApiService;
  let httpTesting: HttpTestingController;
  let i18n: I18nService;
  const baseUrl = `${environment.apiBaseUrl}/customers`;

  const mockCustomer: Customer = {
    id: 'c0000000-0000-4000-8000-000000000001',
    companyName: 'Roams Telecom S.L.',
    taxId: 'B12345678',
    email: 'contacto@roams.es',
    country: 'ES',
    selectedPlan: 'Enterprise',
    createdAt: '2026-11-13T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CustomerApiService,
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(CustomerApiService);
    httpTesting = TestBed.inject(HttpTestingController);
    i18n = TestBed.inject(I18nService);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created with initial signals in default state', () => {
    expect(service).toBeTruthy();
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  describe('search', () => {
    it('should query customers with search term and update signals', () => {
      let result: Customer[] = [];

      service.search('Roams').subscribe((customers) => {
        result = customers;
      });

      expect(service.loading()).toBe(true);

      const req = httpTesting.expectOne(`${baseUrl}?search=Roams`);
      expect(req.request.method).toBe('GET');
      req.flush([mockCustomer]);

      expect(result).toEqual([mockCustomer]);
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('should query all customers when no search term is given', () => {
      let result: Customer[] = [];

      service.search().subscribe((customers) => {
        result = customers;
      });

      const req = httpTesting.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.has('search')).toBe(false);
      expect(req.request.params.has('country')).toBe(false);
      req.flush([mockCustomer]);

      expect(result).toEqual([mockCustomer]);
    });

    it('should query customers with country filter parameter', () => {
      let result: Customer[] = [];

      service.search(undefined, 'ES').subscribe((customers) => {
        result = customers;
      });

      const req = httpTesting.expectOne(`${baseUrl}?country=ES`);
      expect(req.request.method).toBe('GET');
      req.flush([mockCustomer]);

      expect(result).toEqual([mockCustomer]);
    });

    it('should combine search term and country filter in query params', () => {
      service.search('Roams', 'ES').subscribe();

      const req = httpTesting.expectOne(`${baseUrl}?search=Roams&country=ES`);
      expect(req.request.method).toBe('GET');
      req.flush([mockCustomer]);
    });

    it('should omit country param when country is ALL', () => {
      service.search('Roams', 'ALL').subscribe();

      const req = httpTesting.expectOne(`${baseUrl}?search=Roams`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.has('country')).toBe(false);
      req.flush([mockCustomer]);
    });
  });

  describe('getById', () => {
    it('should retrieve customer detail by ID', () => {
      let result: Customer | undefined;

      service.getById(mockCustomer.id).subscribe((customer) => {
        result = customer;
      });

      const req = httpTesting.expectOne(`${baseUrl}/${mockCustomer.id}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCustomer);

      expect(result).toEqual(mockCustomer);
      expect(service.loading()).toBe(false);
    });
  });

  describe('create', () => {
    it('should post new customer and return created entity', () => {
      const payload: CustomerCreate = {
        companyName: 'Roams Telecom S.L.',
        taxId: 'B12345678',
        email: 'contacto@roams.es',
        country: 'ES',
        selectedPlan: 'Enterprise',
      };

      let result: Customer | undefined;

      service.create(payload).subscribe((customer) => {
        result = customer;
      });

      const req = httpTesting.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockCustomer);

      expect(result).toEqual(mockCustomer);
      expect(service.loading()).toBe(false);
    });
  });

  describe('error handling (RFC 7807 via errorInterceptor)', () => {
    it('should capture backend ProblemDetail error and update error signal', () => {
      const backendError: ProblemDetail = {
        type: 'https://errors.saas-o-matic.com/400',
        title: 'Bad Request',
        status: 400,
        detail: 'Invalid tax identifier',
        instance: '/customers',
        invalidParams: [{ name: 'taxId', reason: 'taxId must be valid DNI/NIE/CIF' }],
        timestamp: '2026-11-13T10:00:00.000Z',
      };

      let capturedError: ProblemDetail | undefined;

      service.create({} as CustomerCreate).subscribe({
        next: () => {
          throw new Error('should have failed with 400');
        },
        error: (err: ProblemDetail) => {
          capturedError = err;
        },
      });

      const req = httpTesting.expectOne(baseUrl);
      req.flush(backendError, { status: 400, statusText: 'Bad Request' });

      expect(capturedError).toEqual(backendError);
      expect(service.error()).toEqual(backendError);
      expect(service.loading()).toBe(false);
    });

    it('should receive about:blank fallback normalized by errorInterceptor when network drops', () => {
      let capturedError: ProblemDetail | undefined;

      service.getById('non-existent').subscribe({
        next: () => {
          throw new Error('should have failed with network error');
        },
        error: (err: ProblemDetail) => {
          capturedError = err;
        },
      });

      const req = httpTesting.expectOne(`${baseUrl}/non-existent`);
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

      expect(capturedError?.type).toBe('about:blank');
      expect(capturedError?.title).toBe(i18n.t('error.communication.title'));
      expect(service.error()?.type).toBe('about:blank');
      expect(service.loading()).toBe(false);
    });
  });
});
