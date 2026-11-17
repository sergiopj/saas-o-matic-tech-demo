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
      `${environment.apiBaseUrl}/customers?page=1&limit=4&sortBy=createdAt&order=DESC&fields=lite`
    );
    req.flush(mockCustomers, { headers: { 'x-total-count': '25' } });
    fixture.detectChanges();
  });

  afterEach(() => {
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
});
