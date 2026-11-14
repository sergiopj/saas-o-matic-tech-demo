import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { CustomerCardComponent } from './customer-card.component';
import { Customer } from '../../models/customer.model';
import { I18nService } from '../../../../core/services/i18n.service';
import { CustomerEmailDialogComponent } from '../customer-email-dialog/customer-email-dialog.component';

describe('CustomerCardComponent', () => {
  let fixture: ComponentFixture<CustomerCardComponent>;
  let component: CustomerCardComponent;
  let componentRef: ComponentRef<CustomerCardComponent>;
  let i18nService: I18nService;
  let dialog: MatDialog;

  const mockCustomer: Customer = {
    id: 'cust-123',
    companyName: 'Acme Corporation',
    taxId: 'B12345678',
    email: 'billing@acme.corp',
    country: 'ES',
    selectedPlan: 'Pro',
    createdAt: '2026-11-14T10:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerCardComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('customer', mockCustomer);
    i18nService = TestBed.inject(I18nService);
    dialog = TestBed.inject(MatDialog);
    i18nService.setLanguage('es');
    fixture.detectChanges();
  });

  it('should create the customer card component', () => {
    expect(component).toBeTruthy();
  });

  it('should render company name, taxId, email and selectedPlan', () => {
    const titleEl = fixture.nativeElement.querySelector('.company-name');
    expect(titleEl.textContent.trim()).toBe('Acme Corporation');

    const taxIdEl = fixture.nativeElement.querySelector('.tax-id-badge');
    expect(taxIdEl.textContent.trim()).toBe('B12345678');

    const emailEl = fixture.nativeElement.querySelector('.email-text');
    expect(emailEl.textContent.trim()).toBe('billing@acme.corp');

    const planEl = fixture.nativeElement.querySelector('.plan-pill');
    expect(planEl.textContent.trim()).toBe('Pro');
  });

  it('should render company initial in avatar', () => {
    const avatarEl = fixture.nativeElement.querySelector('.company-avatar');
    expect(avatarEl.textContent.trim()).toBe('A');
  });

  it('should render the country code in the country badge', () => {
    const countryEl = fixture.nativeElement.querySelector('.country-code');
    expect(countryEl.textContent.trim()).toBe('ES');

    componentRef.setInput('customer', { ...mockCustomer, country: 'US' });
    fixture.detectChanges();
    expect(countryEl.textContent.trim()).toBe('US');
  });

  it('should open CustomerEmailDialogComponent when clicking the email button', () => {
    const openSpy = vi.spyOn((component as any).dialog, 'open').mockReturnValue({} as any);

    const emailBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.email-action-btn');
    emailBtn.click();

    expect(openSpy).toHaveBeenCalledWith(
      CustomerEmailDialogComponent,
      expect.objectContaining({
        data: { customer: mockCustomer },
      })
    );
  });

  it('should emit selectCustomer event when onSimulate is called', () => {
    let emittedCustomer: Customer | undefined;
    component.selectCustomer.subscribe((c) => {
      emittedCustomer = c;
    });

    component.onSimulate();
    expect(emittedCustomer).toEqual(mockCustomer);
  });

  it('should configure routerLink targeting customer detail view', () => {
    const simulateBtn: HTMLAnchorElement = fixture.nativeElement.querySelector('.simulate-btn');
    expect(simulateBtn.getAttribute('href')).toBe('/customers/cust-123');
  });
});
