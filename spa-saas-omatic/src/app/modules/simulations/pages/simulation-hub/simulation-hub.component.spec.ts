import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { SimulationHubComponent } from './simulation-hub.component';
import { I18nService } from '../../../../core/services/i18n.service';
import { environment } from '../../../../../environments/environment';
import { Customer } from '../../../customers/models/customer.model';

describe('SimulationHubComponent', () => {
  let fixture: ComponentFixture<SimulationHubComponent>;
  let component: SimulationHubComponent;
  let httpTesting: HttpTestingController;
  let router: Router;

  const mockCustomers: Customer[] = [
    {
      id: 'cust-1',
      companyName: 'Acme Corp',
      taxId: 'B12345678',
      email: 'corp@acme.es',
      country: 'ES',
      selectedPlan: 'Enterprise',
      createdAt: '2026-11-14T10:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimulationHubComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        I18nService,
      ],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(SimulationHubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const req = httpTesting.expectOne(
      `${environment.apiBaseUrl}/customers?page=1&limit=50&sortBy=companyName&order=ASC`
    );
    req.flush(mockCustomers);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create the simulation hub component and load customer options', () => {
    expect(component).toBeTruthy();
    expect(component.customers().length).toBe(1);
  });

  it('should keep the launch button in DOM and disabled when no customer is selected', () => {
    const launchBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.launch-btn');
    expect(launchBtn).toBeTruthy();
    expect(launchBtn.disabled).toBe(true);

    component.onSelectCustomer('cust-1');
    fixture.detectChanges();
    expect(launchBtn.disabled).toBe(false);
  });

  it('should navigate to customer simulation when launcher is clicked', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.onSelectCustomer('cust-1');
    component.goToSimulation();

    expect(navigateSpy).toHaveBeenCalledWith(['/customers', 'cust-1']);
  });

  it('should render 3D badge image in header and no calculator icon circle', () => {
    const badgeImg: HTMLImageElement | null = fixture.nativeElement.querySelector('.simulations-badge-img');
    const iconCircle = fixture.nativeElement.querySelector('.header-icon-circle');

    expect(badgeImg).toBeTruthy();
    expect(badgeImg?.getAttribute('src')).toBe('images/simulations-badge.jpg');
    expect(iconCircle).toBeNull();
  });

  it('should render launcher title as Dynamic Billing Engine without icon', () => {
    const launcherTitle: HTMLElement | null = fixture.nativeElement.querySelector('.launcher-title');
    const launcherBadge = fixture.nativeElement.querySelector('.launcher-badge');
    const iconInTitle = launcherTitle?.querySelector('mat-icon');

    expect(launcherTitle).toBeTruthy();
    expect(launcherTitle?.textContent?.trim()).toBeTruthy();
    expect(launcherBadge).toBeNull();
    expect(iconInTitle).toBeNull();
  });
});
