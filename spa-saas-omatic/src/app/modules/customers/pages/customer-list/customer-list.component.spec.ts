import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CustomerListComponent } from './customer-list.component';
import { I18nService } from '../../../../core/services/i18n.service';
import { errorInterceptor } from '../../../../core/errors/error.interceptor';
import { Customer } from '../../models/customer.model';
import { environment } from '../../../../../environments/environment';

describe('CustomerListComponent', () => {
  let fixture: ComponentFixture<CustomerListComponent>;
  let component: CustomerListComponent;
  let httpTesting: HttpTestingController;
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
    const req = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?page=1&limit=8&sortBy=createdAt&order=DESC`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockCustomers, { headers: { 'x-total-count': '2' } });

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
      `${environment.apiBaseUrl}/customers?search=Roams&page=1&limit=8&sortBy=createdAt&order=DESC`
    );
    expect(req.request.method).toBe('GET');
    req.flush([mockCustomers[0]], { headers: { 'x-total-count': '1' } });
    fixture.detectChanges();

    expect(component.customers().length).toBe(1);
    expect(component.customers()[0].companyName).toBe('Roams Technology');
  });

  it('should render empty state when search returns no results', () => {
    component.onSearchChange('NonExistent');

    const req = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?search=NonExistent&page=1&limit=8&sortBy=createdAt&order=DESC`
    );
    req.flush([], { headers: { 'x-total-count': '0' } });
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();

    const emptyTitle = fixture.nativeElement.querySelector('.empty-title');
    expect(emptyTitle.textContent.trim()).toBe('No se encontraron clientes');
  });

  it('should reset search and reload all customers when onClearSearch is called', () => {
    component.onSearchChange('NonExistent');
    const searchReq = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?search=NonExistent&page=1&limit=8&sortBy=createdAt&order=DESC`
    );
    searchReq.flush([], { headers: { 'x-total-count': '0' } });
    fixture.detectChanges();

    component.onClearSearch();
    const reloadReq = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?page=1&limit=8&sortBy=createdAt&order=DESC`
    );
    reloadReq.flush(mockCustomers, { headers: { 'x-total-count': '2' } });
    fixture.detectChanges();

    expect(component.searchTerm()).toBe('');
    expect(component.customers().length).toBe(2);
  });

  it('should render error banner when customer API reports a problem and retry on click', () => {
    component.onSearchChange('error-trigger');

    const req = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?search=error-trigger&page=1&limit=8&sortBy=createdAt&order=DESC`
    );
    req.flush(
      { message: 'Database unreachable' },
      { status: 500, statusText: 'Internal Server Error' }
    );
    fixture.detectChanges();

    const errorBanner = fixture.nativeElement.querySelector('.error-banner');
    expect(errorBanner).toBeTruthy();
    expect(errorBanner.textContent).toContain(i18nService.t('error.communication.detail'));

    // Status badge must be hidden on 500 per defensive UX guidelines
    const statusBadge = fixture.nativeElement.querySelector('.error-status-badge');
    expect(statusBadge).toBeNull();

    // Retry button should re-trigger customer load
    const retryBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.retry-btn');
    expect(retryBtn).toBeTruthy();
    retryBtn.click();

    const retryReq = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?search=error-trigger&page=1&limit=8&sortBy=createdAt&order=DESC`
    );
    expect(retryReq.request.method).toBe('GET');
    retryReq.flush(mockCustomers, { headers: { 'x-total-count': '2' } });
    fixture.detectChanges();

    expect(component.customers().length).toBe(2);
  });

  it('should compute country filter options dynamically from loaded customers', () => {
    const filters = component.countryFilters();
    expect(filters.length).toBeGreaterThanOrEqual(3);
    expect(filters[0]).toEqual({ code: 'ALL', label: 'Todos los países' });
    expect(filters.some((f) => f.code === 'ES')).toBe(true);
    expect(filters.some((f) => f.code === 'US')).toBe(true);
  });

  it('should render the country filter mat-select field', () => {
    const filterField = fixture.nativeElement.querySelector('.country-filter-field');
    expect(filterField).toBeTruthy();
  });

  it('should trigger server-side query when country is selected', () => {
    component.selectCountry('ES');

    const req = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?country=ES&page=1&limit=8&sortBy=createdAt&order=DESC`
    );
    expect(req.request.method).toBe('GET');
    req.flush([mockCustomers[0]], { headers: { 'x-total-count': '1' } });
    fixture.detectChanges();

    expect(component.customers().length).toBe(1);
    expect(component.customers()[0].country).toBe('ES');

    const cards = fixture.nativeElement.querySelectorAll('app-customer-card');
    expect(cards.length).toBe(1);

    component.selectCountry('ALL');
    const allReq = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?page=1&limit=8&sortBy=createdAt&order=DESC`
    );
    allReq.flush(mockCustomers, { headers: { 'x-total-count': '2' } });
    fixture.detectChanges();

    expect(component.customers().length).toBe(2);
  });

  it('should compute pagination properties and navigate between pages with pure server-side pagination', () => {
    const manyCustomers: Customer[] = Array.from({ length: 8 }, (_, i) => ({
      id: `cust-${i + 1}`,
      companyName: `Company ${i + 1}`,
      taxId: `B1234567${i % 10}`,
      email: `contact${i + 1}@corp.es`,
      country: 'ES',
      selectedPlan: 'Pro',
      createdAt: '2026-11-14T10:00:00.000Z',
    }));

    // Initial page with default size 8 and total 20 items (3 pages)
    component.loadCustomers(1, 8);
    const sizeReq = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?page=1&limit=8&sortBy=createdAt&order=DESC`
    );
    sizeReq.flush(manyCustomers, { headers: { 'x-total-count': '20' } });
    fixture.detectChanges();

    expect(component.totalPages()).toBe(3);
    expect(component.paginatedCustomers().length).toBe(8);
    expect(component.displayedRange()).toEqual({ start: 1, end: 8, total: 20 });

    // Go to page 2 (server query)
    component.goToPage(2);
    const page2Req = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?page=2&limit=8&sortBy=createdAt&order=DESC`
    );
    page2Req.flush(manyCustomers, { headers: { 'x-total-count': '20' } });
    fixture.detectChanges();

    expect(component.currentPage()).toBe(2);
    expect(component.displayedRange()).toEqual({ start: 9, end: 16, total: 20 });

    // Go to page 3 (server query with remaining 4 items)
    component.goToPage(3);
    const page3Req = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?page=3&limit=8&sortBy=createdAt&order=DESC`
    );
    page3Req.flush(manyCustomers.slice(0, 4), { headers: { 'x-total-count': '20' } });
    fixture.detectChanges();

    expect(component.currentPage()).toBe(3);
    expect(component.paginatedCustomers().length).toBe(4);
    expect(component.displayedRange()).toEqual({ start: 17, end: 20, total: 20 });
  });

  it('should trigger server-side query with updated sorting when onSortChange is called', () => {
    component.onSortChange('name_asc');

    const req = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?page=1&limit=8&sortBy=companyName&order=ASC`
    );
    expect(req.request.method).toBe('GET');
    req.flush([mockCustomers[1], mockCustomers[0]], { headers: { 'x-total-count': '2' } });
    fixture.detectChanges();

    expect(component.activeSortKey()).toBe('name_asc');
  });

  it('should render mat-progress-bar and disable pagination controls while request is in flight without activating search spinner', () => {
    // Set total count to 20 so totalPages is 3 and page 2 is valid
    component.totalCount.set(20);
    fixture.detectChanges();

    component.goToPage(2);
    expect(component.customerApi.loading()).toBe(true);
    expect(component.isSearchingText()).toBe(false);

    fixture.detectChanges();

    const progressBar = fixture.nativeElement.querySelector('.grid-loading-bar mat-progress-bar');
    expect(progressBar).toBeTruthy();

    const navButtons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.page-nav-btn')
    );
    expect(navButtons.every((btn) => btn.disabled)).toBe(true);

    const req = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?page=2&limit=8&sortBy=createdAt&order=DESC`
    );
    req.flush(mockCustomers, { headers: { 'x-total-count': '15' } });
    fixture.detectChanges();

    expect(component.customerApi.loading()).toBe(false);
    const postLoadingBar = fixture.nativeElement.querySelector('.grid-loading-bar');
    expect(postLoadingBar).toBeNull();
  });

  it('should localize pagination range text and aria-label according to active language', () => {
    component.totalCount.set(15);
    fixture.detectChanges();

    // Spanish (default in beforeEach)
    const nav = fixture.nativeElement.querySelector('.pagination-container');
    expect(nav.getAttribute('aria-label')).toBe('Paginación de clientes');

    const rangeText = fixture.nativeElement.querySelector('.range-text');
    expect(rangeText.textContent).toContain('Mostrando');
    expect(rangeText.textContent).toContain('de');

    // Switch to English
    i18nService.setLanguage('en');
    fixture.detectChanges();

    expect(nav.getAttribute('aria-label')).toBe('Customer pagination');
    expect(rangeText.textContent).toContain('Showing');
    expect(rangeText.textContent).toContain('of');

    // Switch to German
    i18nService.setLanguage('de');
    fixture.detectChanges();

    expect(nav.getAttribute('aria-label')).toBe('Kundennavigation');
    expect(rangeText.textContent).toContain('Zeige');
    expect(rangeText.textContent).toContain('von');

    // Switch to French
    i18nService.setLanguage('fr');
    fixture.detectChanges();

    expect(nav.getAttribute('aria-label')).toBe('Pagination des clients');
    expect(rangeText.textContent).toContain('Affichage');
    expect(rangeText.textContent).toContain('sur');
  });

  it('should clear search term and reload page 1 on onClearSearch', () => {
    component.searchTerm.set('Acme');
    component.onClearSearch();
    expect(component.searchTerm()).toBe('');

    const req = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?page=1&limit=8&sortBy=createdAt&order=DESC`
    );
    req.flush([], { headers: { 'x-total-count': '0' } });
  });

  it('should handle API failure gracefully and set initialLoading to false', () => {
    component.loadCustomers();
    const req = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?page=1&limit=8&sortBy=createdAt&order=DESC`
    );
    req.error(new ProgressEvent('error'));
    expect(component.initialLoading()).toBe(false);
  });

  it('should ignore goToPage when target page is out of bounds or same page', () => {
    component.goToPage(1); // same page
    component.goToPage(-1); // negative
    component.goToPage(999); // out of totalPages
    httpTesting.expectNone(`${environment.apiBaseUrl}/customers`);
  });

  it('should return zero range when totalCount is 0', () => {
    component.totalCount.set(0);
    expect(component.displayedRange()).toEqual({ start: 0, end: 0, total: 0 });
  });

  it('should change page size and reset to page 1 on onPageSizeChange', () => {
    component.onPageSizeChange(12);
    const req = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?page=1&limit=12&sortBy=createdAt&order=DESC`
    );
    req.flush(mockCustomers, { headers: { 'x-total-count': '15' } });
    expect(component.pageSize()).toBe(12);
  });

  it('should fallback to default sort option when unknown sort key is passed', () => {
    component.onSortChange('unknownKey');
    const req = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?page=1&limit=8&sortBy=createdAt&order=DESC`
    );
    req.flush([], { headers: { 'x-total-count': '0' } });
  });

  it('should navigate through template pagination buttons (next, prev, first, last, page number)', () => {
    component.totalCount.set(32);
    component.currentPage.set(2);
    fixture.detectChanges();

    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.pagination-controls button')
    );
    expect(buttons.length).toBeGreaterThan(0);

    // Click next button
    const nextBtn = buttons.find((b) => b.getAttribute('aria-label') === 'Página siguiente');
    if (nextBtn) {
      nextBtn.click();
      const req = httpTesting.expectOne(
        `${environment.apiBaseUrl}/customers?page=3&limit=8&sortBy=createdAt&order=DESC`
      );
      req.flush(mockCustomers, { headers: { 'x-total-count': '32' } });
    }

    // Click prev button
    const prevBtn = buttons.find((b) => b.getAttribute('aria-label') === 'Página anterior');
    if (prevBtn) {
      prevBtn.click();
      const req = httpTesting.expectOne(
        `${environment.apiBaseUrl}/customers?page=2&limit=8&sortBy=createdAt&order=DESC`
      );
      req.flush(mockCustomers, { headers: { 'x-total-count': '32' } });
    }

    // Click first page button
    const firstBtn = buttons.find((b) => b.getAttribute('aria-label') === 'Primera página');
    if (firstBtn) {
      firstBtn.click();
      const req = httpTesting.expectOne(
        `${environment.apiBaseUrl}/customers?page=1&limit=8&sortBy=createdAt&order=DESC`
      );
      req.flush(mockCustomers, { headers: { 'x-total-count': '32' } });
    }

    // Click last page button
    const lastBtn = buttons.find((b) => b.getAttribute('aria-label') === 'Última página');
    if (lastBtn) {
      lastBtn.click();
      const req = httpTesting.expectOne(
        `${environment.apiBaseUrl}/customers?page=4&limit=8&sortBy=createdAt&order=DESC`
      );
      req.flush(mockCustomers, { headers: { 'x-total-count': '32' } });
    }
  });

  it('should open CustomerCreateDialogComponent when create-customer-btn is clicked', () => {
    const dialog = (component as any).dialog;
    const dialogSpy = vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(undefined),
    } as any);

    const btn: HTMLButtonElement | null = fixture.nativeElement.querySelector('.create-customer-btn');
    expect(btn).toBeTruthy();
    btn?.click();

    expect(dialogSpy).toHaveBeenCalled();
  });

  it('should reload customers on page 1 when CustomerCreateDialogComponent returns newly created customer', () => {
    const dialog = (component as any).dialog;
    vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(mockCustomers[0]),
    } as any);

    component.openCreateCustomerDialog();

    const req = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?page=1&limit=8&sortBy=createdAt&order=DESC`
    );
    req.flush(mockCustomers, { headers: { 'x-total-count': '2' } });
    expect(component.customers().length).toBe(2);
  });
});
