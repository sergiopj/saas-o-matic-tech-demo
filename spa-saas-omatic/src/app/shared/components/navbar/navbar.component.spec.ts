import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NavbarComponent } from './navbar.component';
import { I18nService } from '../../../core/services/i18n.service';
import { environment } from '../../../../environments/environment';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        I18nService,
      ],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);

    // Create component first; child CurrencySelectorComponent instantiates CurrencyService
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;

    // Handle initial rates fetch initiated by child CurrencySelectorComponent
    const req = httpTesting.expectOne(environment.currencyApiUrl);
    req.flush({ result: 'success', rates: { EUR: 1, USD: 1.08 } });

    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create the navbar component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the ROAMS brand badge and SaaS-O-Matic title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.brand-badge')?.textContent).toContain('ROAMS');
    expect(compiled.querySelector('.app-title')?.textContent).toContain('SaaS-O-Matic');
  });

  it('should render the embedded currency selector', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-currency-selector')).toBeTruthy();
  });

  it('should render the embedded language selector', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-language-selector')).toBeTruthy();
  });
});
