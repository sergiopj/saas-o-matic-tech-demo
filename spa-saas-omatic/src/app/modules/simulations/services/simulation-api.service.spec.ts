import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SimulationApiService } from './simulation-api.service';
import { Simulation, SimulationCreate } from '../models/simulation.model';
import { ProblemDetail } from '../../../core/errors/problem-detail.model';
import { errorInterceptor } from '../../../core/errors/error.interceptor';
import { environment } from '../../../../environments/environment';

describe('SimulationApiService', () => {
  let service: SimulationApiService;
  let httpTesting: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/simulations`;

  const mockSimulation: Simulation = {
    id: 's0000000-0000-4000-8000-000000000001',
    customerId: 'c0000000-0000-4000-8000-000000000001',
    activeUsers: 15,
    storageGb: 100,
    apiCalls: 50000,
    monthlyBaseCost: 140,
    taxRate: 0.21,
    taxAmount: 29.4,
    totalCost: 169.4,
    currency: 'EUR',
    createdAt: '2026-11-13T10:30:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SimulationApiService,
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(SimulationApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be created with initial signals in default state', () => {
    expect(service).toBeTruthy();
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  describe('findByCustomer', () => {
    it('should query simulations by customerId query param', () => {
      let result: Simulation[] = [];

      service.findByCustomer(mockSimulation.customerId).subscribe((simulations) => {
        result = simulations;
      });

      expect(service.loading()).toBe(true);

      const req = httpTesting.expectOne(`${baseUrl}?customerId=${mockSimulation.customerId}`);
      expect(req.request.method).toBe('GET');
      req.flush([mockSimulation]);

      expect(result).toEqual([mockSimulation]);
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });
  });

  describe('create', () => {
    it('should post new simulation and return calculated entity', () => {
      const payload: SimulationCreate = {
        customerId: mockSimulation.customerId,
        activeUsers: 15,
        storageGb: 100,
        apiCalls: 50000,
      };

      let result: Simulation | undefined;

      service.create(payload).subscribe((simulation) => {
        result = simulation;
      });

      const req = httpTesting.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockSimulation);

      expect(result).toEqual(mockSimulation);
      expect(service.loading()).toBe(false);
    });
  });

  describe('error handling (RFC 7807 via errorInterceptor)', () => {
    it('should capture backend ProblemDetail and update error signal', () => {
      const backendError: ProblemDetail = {
        type: 'https://errors.saas-o-matic.com/404',
        title: 'Not Found',
        status: 404,
        detail: 'Customer not found',
        instance: '/simulations',
        timestamp: '2026-11-13T10:30:00.000Z',
      };

      let capturedError: ProblemDetail | undefined;

      service.create({} as SimulationCreate).subscribe({
        next: () => {
          throw new Error('should have failed with 404');
        },
        error: (err: ProblemDetail) => {
          capturedError = err;
        },
      });

      const req = httpTesting.expectOne(baseUrl);
      req.flush(backendError, { status: 404, statusText: 'Not Found' });

      expect(capturedError).toEqual(backendError);
      expect(service.error()).toEqual(backendError);
      expect(service.loading()).toBe(false);
    });

    it('should receive about:blank fallback normalized by errorInterceptor on communication failure', () => {
      let capturedError: ProblemDetail | undefined;

      service.findByCustomer('invalid-id').subscribe({
        next: () => {
          throw new Error('should have failed with network error');
        },
        error: (err: ProblemDetail) => {
          capturedError = err;
        },
      });

      const req = httpTesting.expectOne(`${baseUrl}?customerId=invalid-id`);
      req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

      expect(capturedError?.type).toBe('about:blank');
      expect(service.error()?.type).toBe('about:blank');
    });
  });
});
