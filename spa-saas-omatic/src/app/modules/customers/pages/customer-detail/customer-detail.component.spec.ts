import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { CustomerDetailComponent } from './customer-detail.component';
import { I18nService } from '../../../../core/services/i18n.service';
import { environment } from '../../../../../environments/environment';
import { Customer } from '../../models/customer.model';
import { Simulation } from '../../../simulations/models/simulation.model';

describe('CustomerDetailComponent', () => {
  let fixture: ComponentFixture<CustomerDetailComponent>;
  let component: CustomerDetailComponent;
  let httpTesting: HttpTestingController;

  const mockCustomer: Customer = {
    id: 'cust-123',
    companyName: 'Acme Iberia',
    taxId: 'B12345678',
    email: 'finance@acme.es',
    country: 'ES',
    selectedPlan: 'Enterprise',
    createdAt: '2026-11-14T10:00:00.000Z',
  };

  const mockSimulations: Simulation[] = [
    {
      id: 'sim-1',
      customerId: 'cust-123',
      activeUsers: 25,
      storageGb: 50,
      apiCalls: 10000,
      monthlyBaseCost: 220,
      taxRate: 0.21,
      taxAmount: 46.2,
      totalCost: 266.2,
      currency: 'EUR',
      createdAt: '2026-11-14T12:00:00.000Z',
    },
  ];

  const testSimulations: Simulation[] = [
    {
      id: 'sim-alpha',
      customerId: 'cust-123',
      activeUsers: 10,
      storageGb: 20,
      apiCalls: 5000,
      monthlyBaseCost: 100,
      taxRate: 0.21,
      taxAmount: 21,
      totalCost: 121,
      currency: 'EUR',
      createdAt: '2026-11-01T10:00:00.000Z',
    },
    {
      id: 'sim-beta',
      customerId: 'cust-123',
      activeUsers: 35,
      storageGb: 100,
      apiCalls: 25000,
      monthlyBaseCost: 300,
      taxRate: 0.21,
      taxAmount: 63,
      totalCost: 363,
      currency: 'EUR',
      createdAt: '2026-11-10T14:30:00.000Z',
    },
    {
      id: 'sim-gamma',
      customerId: 'cust-123',
      activeUsers: 75,
      storageGb: 350,
      apiCalls: 80000,
      monthlyBaseCost: 545,
      taxRate: 0.21,
      taxAmount: 114.45,
      totalCost: 659.45,
      currency: 'EUR',
      createdAt: '2026-11-15T18:00:00.000Z',
    },
    {
      id: 'sim-delta',
      customerId: 'cust-123',
      activeUsers: 150,
      storageGb: 500,
      apiCalls: 200000,
      monthlyBaseCost: 920,
      taxRate: 0.21,
      taxAmount: 193.2,
      totalCost: 1113.2,
      currency: 'EUR',
      createdAt: '2026-11-17T08:15:00.000Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerDetailComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        I18nService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? 'cust-123' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CustomerDetailComponent);
    component = fixture.componentInstance;

    // Flush rates initiated by CurrencyService constructor
    const ratesReq = httpTesting.expectOne(environment.currencyApiUrl);
    ratesReq.flush({ result: 'success', rates: { EUR: 1, USD: 1.08 } });

    fixture.detectChanges();

    // 1. Flush Customer Get By Id
    const custReq = httpTesting.expectOne(`${environment.apiBaseUrl}/customers/cust-123`);
    expect(custReq.request.method).toBe('GET');
    custReq.flush(mockCustomer);

    // 2. Flush Simulations History
    const simReq = httpTesting.expectOne(`${environment.apiBaseUrl}/simulations?customerId=cust-123`);
    expect(simReq.request.method).toBe('GET');
    simReq.flush(mockSimulations);

    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create the component and populate customer and simulations', () => {
    expect(component).toBeTruthy();
    expect(component.customer()?.companyName).toBe('Acme Iberia');
    expect(component.simulations().length).toBe(1);
    expect(component.activeUsers()).toBe(25);
  });

  it('should load a historical simulation into the studio controls', () => {
    component.loadSimulationIntoStudio({
      id: 'sim-past',
      customerId: 'cust-123',
      activeUsers: 85,
      storageGb: 120,
      apiCalls: 45000,
      monthlyBaseCost: 595,
      taxRate: 0.21,
      taxAmount: 124.95,
      totalCost: 719.95,
      currency: 'EUR',
      createdAt: '2026-11-12T10:00:00.000Z',
    });

    expect(component.activeUsers()).toBe(85);
    expect(component.storageGb()).toBe(120);
    expect(component.apiCalls()).toBe(45000);
  });

  it('should compute tiered pricing projection dynamically for 15 users (ES 21%)', () => {
    component.onUsersInputChange(15);
    fixture.detectChanges();

    const proj = component.projection();
    // 10 users @ 10 = 100, 5 users @ 8 = 40 => 140
    expect(proj.monthlyBaseCostEur).toBe(140);
    // 140 * 0.21 = 29.4
    expect(proj.taxAmountEur).toBe(29.4);
    // 140 + 29.4 = 169.4
    expect(proj.totalCostEur).toBe(169.4);
  });

  it('should save simulation via API and refresh history', () => {
    component.onUsersInputChange(30);
    component.saveSimulation();
    expect(component.isSaving()).toBe(true);

    const postReq = httpTesting.expectOne(`${environment.apiBaseUrl}/simulations`);
    expect(postReq.request.method).toBe('POST');
    expect(postReq.request.body).toEqual({
      customerId: 'cust-123',
      activeUsers: 30,
      storageGb: 50,
      apiCalls: 10000,
    });

    const newSimulation: Simulation = {
      id: 'sim-2',
      customerId: 'cust-123',
      activeUsers: 30,
      storageGb: 50,
      apiCalls: 10000,
      monthlyBaseCost: 260,
      taxRate: 0.21,
      taxAmount: 54.6,
      totalCost: 314.6,
      currency: 'EUR',
      createdAt: '2026-11-16T12:00:00.000Z',
    };
    postReq.flush(newSimulation);

    // Refresh history call
    const refreshReq = httpTesting.expectOne(`${environment.apiBaseUrl}/simulations?customerId=cust-123`);
    refreshReq.flush([newSimulation, ...mockSimulations]);
    fixture.detectChanges();

    expect(component.isSaving()).toBe(false);
    expect(component.saveSuccess()).toBe(true);
    expect(component.simulations().length).toBe(2);
  });

  it('should open email dialog on email composer click', () => {
    const dialog = TestBed.inject(MatDialog);
    const openSpy = vi.spyOn(dialog, 'open').mockReturnValue({
      afterClosed: () => of(null),
    } as unknown as ReturnType<MatDialog['open']>);

    component.openEmailComposer();
    expect(openSpy).toHaveBeenCalled();
  });

  describe('Simulation History Search Filters', () => {
    beforeEach(() => {
      component.simulations.set(testSimulations);
      component.resetFilters();
      fixture.detectChanges();
    });

    it('should open and close the filter drawer', () => {
      expect(component.isFilterDrawerOpen()).toBe(false);
      component.openFilterDrawer();
      expect(component.isFilterDrawerOpen()).toBe(true);
      component.closeFilterDrawer();
      expect(component.isFilterDrawerOpen()).toBe(false);
    });

    it('should filter simulations by active users range (min, max, and exact bounds)', () => {
      // 1. Min users only (>= 35) -> beta (35), gamma (75), delta (150)
      component.filterMinUsers.set(35);
      expect(component.activeFiltersCount()).toBe(1);
      expect(component.filteredSimulations().length).toBe(3);
      expect(component.filteredSimulations().map((s) => s.id)).toEqual(['sim-beta', 'sim-gamma', 'sim-delta']);

      // 2. Max users only (<= 35) -> alpha (10), beta (35)
      component.filterMinUsers.set(null);
      component.filterMaxUsers.set(35);
      expect(component.filteredSimulations().length).toBe(2);
      expect(component.filteredSimulations().map((s) => s.id)).toEqual(['sim-alpha', 'sim-beta']);

      // 3. Range (20 to 80) -> beta (35), gamma (75)
      component.filterMinUsers.set(20);
      component.filterMaxUsers.set(80);
      expect(component.filteredSimulations().length).toBe(2);
      expect(component.filteredSimulations().map((s) => s.id)).toEqual(['sim-beta', 'sim-gamma']);

      // 4. Out of range (> 200) -> 0 matches
      component.filterMinUsers.set(200);
      component.filterMaxUsers.set(null);
      expect(component.filteredSimulations().length).toBe(0);
    });

    it('should filter simulations by storage GB range (min, max, and exact bounds)', () => {
      // 1. Min storage only (>= 100) -> beta (100), gamma (350), delta (500)
      component.filterMinStorage.set(100);
      expect(component.activeFiltersCount()).toBe(1);
      expect(component.filteredSimulations().length).toBe(3);

      // 2. Max storage only (<= 100) -> alpha (20), beta (100)
      component.filterMinStorage.set(null);
      component.filterMaxStorage.set(100);
      expect(component.filteredSimulations().length).toBe(2);

      // 3. Storage range (50 to 400 GB) -> beta (100), gamma (350)
      component.filterMinStorage.set(50);
      component.filterMaxStorage.set(400);
      expect(component.filteredSimulations().length).toBe(2);

      // 4. Impossible storage bound (< 10) -> 0 matches
      component.filterMinStorage.set(null);
      component.filterMaxStorage.set(10);
      expect(component.filteredSimulations().length).toBe(0);
    });

    it('should filter simulations by API calls volume (min, max, and exact bounds)', () => {
      // 1. Min API calls only (>= 25000) -> beta (25000), gamma (80000), delta (200000)
      component.filterMinApiCalls.set(25000);
      expect(component.activeFiltersCount()).toBe(1);
      expect(component.filteredSimulations().length).toBe(3);

      // 2. Max API calls only (<= 25000) -> alpha (5000), beta (25000)
      component.filterMinApiCalls.set(null);
      component.filterMaxApiCalls.set(25000);
      expect(component.filteredSimulations().length).toBe(2);

      // 3. API calls range (10000 to 100000) -> beta (25000), gamma (80000)
      component.filterMinApiCalls.set(10000);
      component.filterMaxApiCalls.set(100000);
      expect(component.filteredSimulations().length).toBe(2);

      // 4. Impossible API calls (> 300000) -> 0 matches
      component.filterMinApiCalls.set(300000);
      component.filterMaxApiCalls.set(null);
      expect(component.filteredSimulations().length).toBe(0);
    });

    it('should filter simulations by creation date range (from, to, and same-day bounds)', () => {
      // 1. Date From only (>= 2026-11-05) -> beta (Nov 10), gamma (Nov 15), delta (Nov 17)
      component.onDateFromChange(new Date('2026-11-05'));
      expect(component.activeFiltersCount()).toBe(1);
      expect(component.filteredSimulations().length).toBe(3);

      // 2. Date To only (<= 2026-11-12) -> alpha (Nov 01), beta (Nov 10)
      component.onDateFromChange(null);
      component.onDateToChange(new Date('2026-11-12'));
      expect(component.filteredSimulations().length).toBe(2);

      // 3. Date Range (2026-11-05 to 2026-11-16) -> beta (Nov 10), gamma (Nov 15)
      component.onDateFromChange(new Date('2026-11-05'));
      component.onDateToChange(new Date('2026-11-16'));
      expect(component.filteredSimulations().length).toBe(2);

      // 4. Exact Same-Day Match: Nov 10 covers beta (2026-11-10T14:30:00Z)
      component.onDateFromChange(new Date('2026-11-10'));
      component.onDateToChange(new Date('2026-11-10'));
      expect(component.filteredSimulations().length).toBe(1);
      expect(component.filteredSimulations()[0].id).toBe('sim-beta');
    });

    it('should filter with multicriteria combining all 4 filter categories simultaneously', () => {
      // Apply filters on all 4 dimensions:
      // Users: 30 to 100 (matches beta, gamma)
      component.filterMinUsers.set(30);
      component.filterMaxUsers.set(100);

      // Storage: 50 to 400 GB (matches beta, gamma)
      component.filterMinStorage.set(50);
      component.filterMaxStorage.set(400);

      // API calls: 20000 to 90000 (matches beta, gamma)
      component.filterMinApiCalls.set(20000);
      component.filterMaxApiCalls.set(90000);

      // Date range: 2026-11-12 to 2026-11-16 (excludes beta Nov 10, matches ONLY gamma Nov 15)
      component.onDateFromChange(new Date('2026-11-12'));
      component.onDateToChange(new Date('2026-11-16'));

      expect(component.activeFiltersCount()).toBe(4);
      expect(component.filteredSimulations().length).toBe(1);
      expect(component.filteredSimulations()[0].id).toBe('sim-gamma');
    });

    it('should reset all filters and return to initial unfiltered state', () => {
      component.filterMinUsers.set(50);
      component.filterMaxUsers.set(100);
      component.filterMinStorage.set(100);
      component.filterMaxStorage.set(300);
      component.filterMinApiCalls.set(10000);
      component.filterMaxApiCalls.set(50000);
      component.onDateFromChange(new Date('2026-11-01'));
      component.onDateToChange(new Date('2026-11-10'));
      component.historyPage.set(2);

      expect(component.activeFiltersCount()).toBe(4);

      component.resetFilters();

      expect(component.filterDateFrom()).toBeNull();
      expect(component.filterDateTo()).toBeNull();
      expect(component.filterMinUsers()).toBeNull();
      expect(component.filterMaxUsers()).toBeNull();
      expect(component.filterMinStorage()).toBeNull();
      expect(component.filterMaxStorage()).toBeNull();
      expect(component.filterMinApiCalls()).toBeNull();
      expect(component.filterMaxApiCalls()).toBeNull();
      expect(component.activeFiltersCount()).toBe(0);
      expect(component.historyPage()).toBe(1);
      expect(component.filteredSimulations().length).toBe(4);
    });

    it('should handle HTML input event change handlers and reset page to 1', () => {
      component.historyPage.set(3);

      // 1. Min Users change
      const minUsersInput = { target: { value: '40' } } as unknown as Event;
      component.onMinUsersChange(minUsersInput);
      expect(component.filterMinUsers()).toBe(40);
      expect(component.historyPage()).toBe(1);

      // Clear via empty string
      const minUsersEmpty = { target: { value: '' } } as unknown as Event;
      component.onMinUsersChange(minUsersEmpty);
      expect(component.filterMinUsers()).toBeNull();

      // 2. Max Users change
      const maxUsersInput = { target: { value: '90' } } as unknown as Event;
      component.onMaxUsersChange(maxUsersInput);
      expect(component.filterMaxUsers()).toBe(90);

      const maxUsersEmpty = { target: { value: '' } } as unknown as Event;
      component.onMaxUsersChange(maxUsersEmpty);
      expect(component.filterMaxUsers()).toBeNull();

      // 3. Min Storage change
      const minStorageInput = { target: { value: '150' } } as unknown as Event;
      component.onMinStorageChange(minStorageInput);
      expect(component.filterMinStorage()).toBe(150);

      const minStorageEmpty = { target: { value: '' } } as unknown as Event;
      component.onMinStorageChange(minStorageEmpty);
      expect(component.filterMinStorage()).toBeNull();

      // 4. Max Storage change
      const maxStorageInput = { target: { value: '400' } } as unknown as Event;
      component.onMaxStorageChange(maxStorageInput);
      expect(component.filterMaxStorage()).toBe(400);

      const maxStorageEmpty = { target: { value: '' } } as unknown as Event;
      component.onMaxStorageChange(maxStorageEmpty);
      expect(component.filterMaxStorage()).toBeNull();

      // 5. Min API Calls change
      const minApiInput = { target: { value: '30000' } } as unknown as Event;
      component.onMinApiCallsChange(minApiInput);
      expect(component.filterMinApiCalls()).toBe(30000);

      const minApiEmpty = { target: { value: '' } } as unknown as Event;
      component.onMinApiCallsChange(minApiEmpty);
      expect(component.filterMinApiCalls()).toBeNull();

      // 6. Max API Calls change
      const maxApiInput = { target: { value: '100000' } } as unknown as Event;
      component.onMaxApiCallsChange(maxApiInput);
      expect(component.filterMaxApiCalls()).toBe(100000);

      const maxApiEmpty = { target: { value: '' } } as unknown as Event;
      component.onMaxApiCallsChange(maxApiEmpty);
      expect(component.filterMaxApiCalls()).toBeNull();
    });

    it('should paginate filtered simulations properly and adjust slice on page change', () => {
      // 4 simulations in total, page size = 2
      component.historyPageSize.set(2);
      component.historyPage.set(1);

      expect(component.paginatedSimulations().length).toBe(2);
      expect(component.paginatedSimulations().map((s) => s.id)).toEqual(['sim-alpha', 'sim-beta']);

      component.historyPage.set(2);
      expect(component.paginatedSimulations().length).toBe(2);
      expect(component.paginatedSimulations().map((s) => s.id)).toEqual(['sim-gamma', 'sim-delta']);

      // Filter down to 1 simulation (e.g. minUsers = 100 -> delta only)
      component.filterMinUsers.set(100);
      component.historyPage.set(1);

      expect(component.filteredSimulations().length).toBe(1);
      expect(component.paginatedSimulations().length).toBe(1);
      expect(component.paginatedSimulations()[0].id).toBe('sim-delta');
    });

    it('should reflect active filter count and drawer trigger in the template', () => {
      fixture.detectChanges();

      const triggerBtn = fixture.nativeElement.querySelector('.filter-trigger-btn') as HTMLButtonElement;
      expect(triggerBtn).toBeTruthy();

      // Initially no active badge
      expect(triggerBtn.querySelector('.active-badge')).toBeNull();

      // Apply 2 filters (users + storage)
      component.filterMinUsers.set(20);
      component.filterMinStorage.set(50);
      fixture.detectChanges();

      const badge = triggerBtn.querySelector('.active-badge');
      expect(badge).toBeTruthy();
      expect(badge?.textContent?.trim()).toBe('2');
      expect(triggerBtn.classList.contains('has-active-filters')).toBe(true);

      // Clicking trigger opens drawer
      triggerBtn.click();
      fixture.detectChanges();
      expect(component.isFilterDrawerOpen()).toBe(true);
    });

    it('should update active users and reset saveSuccess on slider change', () => {
      const event = { target: { value: '45' } } as unknown as Event;
      component.saveSuccess.set(true);
      component.onUsersSliderChange(event);
      expect(component.activeUsers()).toBe(45);
      expect(component.saveSuccess()).toBe(false);

      // Invalid slider value should be ignored
      const invalidEvent = { target: { value: 'NaN' } } as unknown as Event;
      component.onUsersSliderChange(invalidEvent);
      expect(component.activeUsers()).toBe(45);
    });

    it('should update storage and apiCalls inputs and reset saveSuccess', () => {
      component.saveSuccess.set(true);
      component.onStorageChange(80);
      expect(component.storageGb()).toBe(80);
      expect(component.saveSuccess()).toBe(false);

      component.saveSuccess.set(true);
      component.onApiCallsChange(35000);
      expect(component.apiCalls()).toBe(35000);
      expect(component.saveSuccess()).toBe(false);
    });

    it('should handle saveSimulation failure gracefully and reset isSaving', () => {
      component.customer.set(mockCustomer);
      component.saveSimulation();
      expect(component.isSaving()).toBe(true);

      const req = httpTesting.expectOne(`${environment.apiBaseUrl}/simulations`);
      req.error(new ProgressEvent('error'));
      expect(component.isSaving()).toBe(false);
      expect(component.saveSuccess()).toBe(false);
    });

    it('should handle loadSimulationsHistory failure gracefully', () => {
      component.loadSimulationsHistory('cust-123');
      const req = httpTesting.expectOne(`${environment.apiBaseUrl}/simulations?customerId=cust-123`);
      req.error(new ProgressEvent('error'));
      expect(component.simulationsLoading()).toBe(false);
    });

    it('should not open email dialog if customer is null', () => {
      const dialog = TestBed.inject(MatDialog);
      const dialogSpy = vi.spyOn(dialog, 'open');
      component.customer.set(null);
      component.openEmailComposer();
      expect(dialogSpy).not.toHaveBeenCalled();
    });

    it('should handle loadCustomerData failure gracefully and reset customerLoading', () => {
      component.loadCustomerData('cust-error');
      const req = httpTesting.expectOne(`${environment.apiBaseUrl}/customers/cust-error`);
      req.error(new ProgressEvent('error'));
      expect(component.customerLoading()).toBe(false);
    });
  });
});
