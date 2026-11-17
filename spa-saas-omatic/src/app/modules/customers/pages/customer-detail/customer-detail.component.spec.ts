import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
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
    } as any);

    component.openEmailComposer();
    expect(openSpy).toHaveBeenCalled();
  });
});
