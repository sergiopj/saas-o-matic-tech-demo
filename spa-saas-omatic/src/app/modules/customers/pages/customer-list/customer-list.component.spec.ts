import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CustomerListComponent } from './customer-list.component';
import { CustomerApiService } from '../../services/customer-api.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { errorInterceptor } from '../../../../core/errors/error.interceptor';
import { Customer } from '../../models/customer.model';
import { environment } from '../../../../../environments/environment';

describe('CustomerListComponent', () => {
  let fixture: ComponentFixture<CustomerListComponent>;
  let component: CustomerListComponent;
  let httpTesting: HttpTestingController;
  let customerApi: CustomerApiService;
  let i18nService: I18nService;

  const mockCustomers: Customer[] = [
    {
      id: 'cust-1',
      companyName: 'Roams Technology',
      taxId: 'B12345678',
      email: 'tech@roams.es',
      country: 'ES',
      selectedPlan: 'Enterprise',
      createdAt: '2026-11-14T10:00:00.000Z',
    },
    {
      id: 'cust-2',
      companyName: 'Acme SaaS',
      taxId: 'A87654321',
      email: 'contact@acme.io',
      country: 'US',
      selectedPlan: 'Pro',
      createdAt: '2026-11-14T11:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerListComponent],
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerListComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    i18nService = TestBed.inject(I18nService);
    i18nService.setLanguage('es');

    // Trigger initial change detection to execute ngOnInit() -> loadCustomers()
    fixture.detectChanges();

    // Flush initial GET /customers triggered by ngOnInit
    const req = httpTesting.expectOne(`${environment.apiBaseUrl}/customers`);
    expect(req.request.method).toBe('GET');
    req.flush(mockCustomers);

    // Update DOM with flushed customers
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create the component and populate customers on init', () => {
    expect(component).toBeTruthy();
    expect(component.customers().length).toBe(2);

    const cards = fixture.nativeElement.querySelectorAll('app-customer-card');
    expect(cards.length).toBe(2);
  });

  it('should display the count badge with total registered customers', () => {
    const badge = fixture.nativeElement.querySelector('.count-badge');
    expect(badge.textContent.trim()).toBe('2');
  });

  it('should trigger search query to API when onSearchChange is called', () => {
    component.onSearchChange('Roams');

    const req = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?search=Roams`
    );
    expect(req.request.method).toBe('GET');
    req.flush([mockCustomers[0]]);
    fixture.detectChanges();

    expect(component.customers().length).toBe(1);
    expect(component.customers()[0].companyName).toBe('Roams Technology');
  });

  it('should render empty state when search returns no results', () => {
    component.onSearchChange('NonExistent');

    const req = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?search=NonExistent`
    );
    req.flush([]);
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();

    const emptyTitle = fixture.nativeElement.querySelector('.empty-title');
    expect(emptyTitle.textContent.trim()).toBe('No se encontraron clientes');
  });

  it('should reset search and reload all customers when onClearSearch is called', () => {
    component.onSearchChange('NonExistent');
    const searchReq = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?search=NonExistent`
    );
    searchReq.flush([]);
    fixture.detectChanges();

    component.onClearSearch();
    const reloadReq = httpTesting.expectOne(`${environment.apiBaseUrl}/customers`);
    reloadReq.flush(mockCustomers);
    fixture.detectChanges();

    expect(component.searchTerm()).toBe('');
    expect(component.customers().length).toBe(2);
  });

  it('should render error banner when customer API reports a problem', () => {
    component.onSearchChange('error-trigger');

    const req = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?search=error-trigger`
    );
    req.flush(
      {
        type: 'about:blank',
        title: 'Communication Error',
        status: 500,
        detail: 'Database unreachable',
        instance: '/customers',
        timestamp: '2026-11-14T10:00:00.000Z',
      },
      { status: 500, statusText: 'Internal Server Error' }
    );
    fixture.detectChanges();

    const errorBanner = fixture.nativeElement.querySelector('.error-banner');
    expect(errorBanner).toBeTruthy();
    expect(errorBanner.textContent).toContain('Database unreachable');
  });

  it('should compute country filter options dynamically from loaded customers', () => {
    const filters = component.countryFilters();
    expect(filters.length).toBe(3); // ALL, ES, US
    expect(filters[0]).toEqual({ code: 'ALL', label: 'Todos los países' });
    expect(filters[1]).toEqual({ code: 'ES', label: 'ES' });
    expect(filters[2]).toEqual({ code: 'US', label: 'US' });
  });

  it('should render the country filter mat-select field', () => {
    const filterField = fixture.nativeElement.querySelector('.country-filter-field');
    expect(filterField).toBeTruthy();
  });

  it('should trigger server-side query when country is selected', () => {
    component.selectCountry('ES');

    const req = httpTesting.expectOne(`${environment.apiBaseUrl}/customers?country=ES`);
    expect(req.request.method).toBe('GET');
    req.flush([mockCustomers[0]]);
    fixture.detectChanges();

    expect(component.customers().length).toBe(1);
    expect(component.customers()[0].country).toBe('ES');

    const cards = fixture.nativeElement.querySelectorAll('app-customer-card');
    expect(cards.length).toBe(1);

    component.selectCountry('ALL');
    const allReq = httpTesting.expectOne(`${environment.apiBaseUrl}/customers`);
    allReq.flush(mockCustomers);
    fixture.detectChanges();

    expect(component.customers().length).toBe(2);
  });
});
