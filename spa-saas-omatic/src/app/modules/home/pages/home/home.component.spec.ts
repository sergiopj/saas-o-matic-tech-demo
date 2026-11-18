import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';
import { I18nService } from '../../../../core/services/i18n.service';
import { environment } from '../../../../../environments/environment';
import { CustomerLite } from '../../../customers/models/customer.model';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let component: HomeComponent;
  let httpTesting: HttpTestingController;

  const mockCustomers: CustomerLite[] = [
    {
      id: 'cust-1',
      companyName: 'Roams Corp',
      country: 'ES',
    },
    {
      id: 'cust-2',
      companyName: 'Acme DE',
      country: 'DE',
    },
  ];

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        I18nService,
      ],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;

    // Flush rates initiated by CurrencyService constructor
    const ratesReq = httpTesting.expectOne(environment.currencyApiUrl);
    ratesReq.flush({ result: 'success', rates: { EUR: 1, USD: 1.08 } });

    fixture.detectChanges();

    const req = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?page=1&limit=12&sortBy=createdAt&order=DESC&fields=lite`
    );
    req.flush(mockCustomers, { headers: { 'x-total-count': '25' } });

    // Advance fake timers to allow count-up and radial clock-sweep animations to complete
    vi.advanceTimersByTime(1500);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    httpTesting.verify();
  });

  it('should create the home component and load recent customers', () => {
    expect(component).toBeTruthy();
    expect(component.recentCustomers().length).toBe(2);
    expect(component.totalCustomers()).toBe(25);
  });

  it('should render KPI values correctly', () => {
    const kpiValues = fixture.nativeElement.querySelectorAll('.kpi-value');
    expect(kpiValues[0].textContent.trim()).toBe('25'); // Total customers
    expect(kpiValues[1].textContent.trim()).toBe('8'); // 8 fiscal jurisdictions
    expect(kpiValues[2].textContent.trim()).toBe('3'); // 3 tiers
  });

  it('should render customer cards for recent customers', () => {
    const cards = fixture.nativeElement.querySelectorAll('.customer-lite-card');
    expect(cards.length).toBe(2);
    const company = fixture.nativeElement.querySelector('.lite-company');
    expect(company.textContent.trim()).toBe('Roams Corp');
    const simulateBtn = fixture.nativeElement.querySelector('.lite-simulate-btn');
    expect(simulateBtn).toBeTruthy();
  });

  it('should render registered customers KPI card as a link navigating to /customers', () => {
    const customerKpiLink: HTMLAnchorElement | null = fixture.nativeElement.querySelector('a.kpi-card.clickable');
    expect(customerKpiLink).toBeTruthy();
    expect(customerKpiLink?.getAttribute('href') || customerKpiLink?.getAttribute('ng-reflect-router-link')).toContain('/customers');
  });

  it('should synchronize numeric count-up and radial sweep angle to 360 degrees', () => {
    expect(component.displayedCustomers()).toBe(25);
    expect(component.customersFillAngle()).toBe(360);
    expect(component.displayedCountries()).toBe(8);
    expect(component.countriesFillAngle()).toBe(360);
    expect(component.displayedTiers()).toBe(3);
    expect(component.tiersFillAngle()).toBe(360);

    const blueCircle: HTMLElement | null = fixture.nativeElement.querySelector('.kpi-icon-circle.blue');
    expect(blueCircle?.style.getPropertyValue('--fill-angle')).toBe('360deg');
  });

  it('should accurately interpolate synchronized steps during animateKpi', () => {
    let capturedVal = 0;
    let capturedAngle = 0;

    component.animateKpi(
      100,
      (val) => { capturedVal = val; },
      (deg) => { capturedAngle = deg; },
      1000
    );

    // Initial instant step
    expect(capturedVal).toBeGreaterThanOrEqual(0);
    expect(capturedAngle).toBeGreaterThanOrEqual(0);

    // Advance halfway
    vi.advanceTimersByTime(500);
    expect(capturedVal).toBeGreaterThan(0);
    expect(capturedAngle).toBeGreaterThan(0);
    expect(capturedAngle).toBeLessThanOrEqual(360);

    // Complete animation
    vi.advanceTimersByTime(600);
    expect(capturedVal).toBe(100);
    expect(capturedAngle).toBe(360);
  });

  it('should cancel active animation frame requests on ngOnDestroy', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    component.ngOnDestroy();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('should render the customer carousel component when recent customers are loaded', () => {
    const carouselEl = fixture.nativeElement.querySelector('app-customer-carousel');
    expect(carouselEl).toBeTruthy();
    const cards = fixture.nativeElement.querySelectorAll('.customer-lite-card');
    expect(cards.length).toBe(2);
  });
});
