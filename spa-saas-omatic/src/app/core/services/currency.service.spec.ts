import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CurrencyService } from './currency.service';
import { ExchangeRateApiResponse } from '../models/currency.model';
import { environment } from '../../../environments/environment';

describe('CurrencyService', () => {
  let service: CurrencyService;
  let httpTesting: HttpTestingController;

  const mockApiResponse: ExchangeRateApiResponse = {
    result: 'success',
    base_code: 'EUR',
    time_last_update_utc: 'Fri, 13 Nov 2026 12:00:00 +0000',
    rates: {
      EUR: 1.0,
      USD: 1.10,
      GBP: 0.88,
      CHF: 0.96,
      CAD: 1.50,
      JPY: 165.0,
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CurrencyService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(CurrencyService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should be initialized with EUR as default currency', () => {
    // Handle the constructor automatic fetch
    const req = httpTesting.expectOne(environment.currencyApiUrl);
    req.flush(mockApiResponse);

    expect(service.selectedCurrency()).toBe('EUR');
    expect(service.currentSymbol()).toBe('€');
    expect(service.currentRate()).toBe(1.0);
  });

  it('should update rates signal when live API returns data', () => {
    const req = httpTesting.expectOne(environment.currencyApiUrl);
    req.flush(mockApiResponse);

    expect(service.rates()['USD']).toBe(1.10);
    expect(service.rates()['GBP']).toBe(0.88);
    expect(service.loading()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('should retain fallback rates and set error signal on network failure', () => {
    const req = httpTesting.expectOne(environment.currencyApiUrl);
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Network Error' });

    expect(service.rates()['EUR']).toBe(1.0);
    expect(service.rates()['USD']).toBeGreaterThan(0);
    expect(service.error()).toBeTruthy();
    expect(service.loading()).toBe(false);
  });

  it('should update selected currency and recompute rate dynamically', () => {
    const req = httpTesting.expectOne(environment.currencyApiUrl);
    req.flush(mockApiResponse);

    service.setCurrency('USD');
    expect(service.selectedCurrency()).toBe('USD');
    expect(service.currentSymbol()).toBe('$');
    expect(service.currentRate()).toBe(1.10);

    service.setCurrency('GBP');
    expect(service.selectedCurrency()).toBe('GBP');
    expect(service.currentSymbol()).toBe('£');
    expect(service.currentRate()).toBe(0.88);
  });

  it('should convert EUR amounts to target currency with 2 decimals precision', () => {
    const req = httpTesting.expectOne(environment.currencyApiUrl);
    req.flush(mockApiResponse);

    // 100 EUR * 1.10 = 110.00 USD
    expect(service.convert(100, 'USD')).toBe(110.00);

    // 140 EUR * 0.88 = 123.20 GBP
    expect(service.convert(140, 'GBP')).toBe(123.20);

    // Active currency conversion
    service.setCurrency('USD');
    expect(service.convert(100)).toBe(110.00);
  });
});
