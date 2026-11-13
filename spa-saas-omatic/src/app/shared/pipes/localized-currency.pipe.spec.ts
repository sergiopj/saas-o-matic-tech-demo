import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LocalizedCurrencyPipe } from './localized-currency.pipe';
import { CurrencyService } from '../../core/services/currency.service';

describe('LocalizedCurrencyPipe', () => {
  let pipe: LocalizedCurrencyPipe;
  let currencyService: CurrencyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CurrencyService,
        LocalizedCurrencyPipe,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    pipe = TestBed.inject(LocalizedCurrencyPipe);
    currencyService = TestBed.inject(CurrencyService);
  });

  it('should return em-dash for null, undefined or NaN values', () => {
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
    expect(pipe.transform(NaN)).toBe('—');
  });

  it('should format amount in EUR using Spanish locale formatting (1250,50 €)', () => {
    currencyService.setCurrency('EUR');
    const result = pipe.transform(1250.5);
    // Spanish formatting uses comma for decimals and € symbol (CLDR/RAE allows 4 digits without separator)
    expect(result).toMatch(/1[\s.]?250,50/);
    expect(result).toContain('€');
  });

  it('should format amount in USD using US locale formatting ($108.00)', () => {
    // 100 EUR * 1.08 fallback rate = 108.00 USD
    const result = pipe.transform(100, 'USD');
    expect(result).toMatch(/\$108\.00/);
  });

  it('should format amount in GBP using UK locale formatting (£85.00)', () => {
    // 100 EUR * 0.85 fallback rate = 85.00 GBP
    const result = pipe.transform(100, 'GBP');
    expect(result).toMatch(/£85\.00/);
  });

  it('should format amount in JPY with 0 decimals using Japanese locale formatting', () => {
    // 100 EUR * 162.50 fallback rate = 16,250 JPY (no decimals)
    const result = pipe.transform(100, 'JPY');
    expect(result).toMatch(/[¥￥]16,250/);
    expect(result).not.toContain('.');
  });

  it('should reactively update when CurrencyService selectedCurrency changes', () => {
    currencyService.setCurrency('GBP');
    const result = pipe.transform(100);
    expect(result).toMatch(/£85\.00/);
  });

  it('should gracefully format unconfigured ISO currencies using native Intl defaults', () => {
    const result = pipe.transform(100, 'AUD' as any);
    expect(result).toMatch(/100/);
    expect(result).toMatch(/A\$|AUD/);
  });
});
