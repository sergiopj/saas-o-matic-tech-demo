import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CurrencySelectorComponent } from './currency-selector.component';
import { CurrencyService } from '../../../core/services/currency.service';
import { I18nService } from '../../../core/services/i18n.service';
import { environment } from '../../../../environments/environment';

describe('CurrencySelectorComponent', () => {
  let component: CurrencySelectorComponent;
  let fixture: ComponentFixture<CurrencySelectorComponent>;
  let currencyService: CurrencyService;
  let httpTesting: HttpTestingController;
  let i18nService: I18nService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CurrencySelectorComponent],
      providers: [
        CurrencyService,
        I18nService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CurrencySelectorComponent);
    component = fixture.componentInstance;
    currencyService = TestBed.inject(CurrencyService);
    httpTesting = TestBed.inject(HttpTestingController);
    i18nService = TestBed.inject(I18nService);
    i18nService.setLanguage('es');

    // Flush initial fetch from CurrencyService constructor
    const req = httpTesting.expectOne(environment.currencyApiUrl);
    req.flush({ result: 'success', rates: { EUR: 1, USD: 1.08 } });

    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create the currency selector component', () => {
    expect(component).toBeTruthy();
  });

  it('should default to EUR as selected currency', () => {
    expect(component.selectedCurrency()).toBe('EUR');
  });

  it('should delegate setCurrency to CurrencyService on currency change', () => {
    component.onCurrencyChange('USD');
    expect(currencyService.selectedCurrency()).toBe('USD');
  });

  it('should compute localized status tooltip using I18nService', () => {
    // 1. Synced state (Spanish)
    expect(component.statusTooltip()).toBe(i18nService.t('currency.sync.synced'));

    // 2. Loading state
    currencyService.loading.set(true);
    expect(component.statusTooltip()).toBe(i18nService.t('currency.sync.loading'));

    // 3. Error state
    currencyService.loading.set(false);
    currencyService.error.set('Network failure');
    expect(component.statusTooltip()).toBe(i18nService.t('currency.sync.error'));

    // 4. English toggle
    i18nService.setLanguage('en');
    expect(component.statusTooltip()).toContain('Exchange rates API unavailable');
  });
});
