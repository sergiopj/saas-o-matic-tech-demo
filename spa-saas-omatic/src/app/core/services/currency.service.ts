import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  CurrencyCode,
  CurrencyOption,
  ExchangeRateApiResponse,
  SUPPORTED_CURRENCIES,
  CURRENCY_METADATA,
} from '../models/currency.model';

const DEFAULT_FALLBACK_RATES: Record<CurrencyCode, number> = {
  EUR: 1.00,
  USD: 1.08,
  GBP: 0.85,
  CHF: 0.95,
  CAD: 1.45,
  JPY: 162.50,
};

@Injectable({
  providedIn: 'root',
})
export class CurrencyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.currencyApiUrl;

  readonly selectedCurrency = signal<CurrencyCode>('EUR');
  readonly rates = signal<Record<string, number>>(DEFAULT_FALLBACK_RATES);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly currentRate = computed(() => {
    const currency = this.selectedCurrency();
    return this.rates()[currency] ?? 1;
  });

  readonly currencyOptions = computed<CurrencyOption[]>(() =>
    SUPPORTED_CURRENCIES.map((code) => ({
      code,
      label: CURRENCY_METADATA[code].label,
      symbol: CURRENCY_METADATA[code].symbol,
    }))
  );

  readonly currentSymbol = computed(() => {
    return CURRENCY_METADATA[this.selectedCurrency()]?.symbol ?? '€';
  });

  constructor() {
    this.fetchRates();
  }

  fetchRates(): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<ExchangeRateApiResponse>(this.apiUrl).subscribe({
      next: (response) => {
        if (response && response.rates) {
          this.rates.set({
            ...DEFAULT_FALLBACK_RATES,
            ...response.rates,
          });
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.warn('Currency API unreachable, using resilient fallback rates:', err);
        this.error.set('Could not refresh live exchange rates. Using cached rates.');
        this.loading.set(false);
      },
    });
  }

  setCurrency(code: CurrencyCode): void {
    if (SUPPORTED_CURRENCIES.includes(code)) {
      this.selectedCurrency.set(code);
    }
  }

  convert(amountInEur: number, targetCurrency?: CurrencyCode): number {
    const target = targetCurrency ?? this.selectedCurrency();
    const rate = this.rates()[target] ?? 1;
    return Math.round(amountInEur * rate * 100) / 100;
  }
}
