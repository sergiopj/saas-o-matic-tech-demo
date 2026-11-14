import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { provideRouter } from '@angular/router';
import { CustomerCardComponent } from './customer-card.component';
import { Customer } from '../../models/customer.model';
import { I18nService } from '../../../../core/services/i18n.service';

describe('CustomerCardComponent', () => {
  let fixture: ComponentFixture<CustomerCardComponent>;
  let component: CustomerCardComponent;
  let componentRef: ComponentRef<CustomerCardComponent>;
  let i18nService: I18nService;

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

  it('should compute country flag emoji from 2-letter country code', () => {
    expect(component.countryFlag).toBe('🇪🇸');

    componentRef.setInput('customer', { ...mockCustomer, country: 'US' });
    fixture.detectChanges();
    expect(component.countryFlag).toBe('🇺🇸');

    componentRef.setInput('customer', { ...mockCustomer, country: 'UNKNOWN' });
    fixture.detectChanges();
    expect(component.countryFlag).toBe('🌐');
  });

  it('should emit selectCustomer event when simulate button is clicked', () => {
    let emittedCustomer: Customer | undefined;
    component.selectCustomer.subscribe((c) => {
      emittedCustomer = c;
    });

    const simulateBtn: HTMLAnchorElement = fixture.nativeElement.querySelector('.simulate-btn');
    expect(simulateBtn).toBeTruthy();
    simulateBtn.click();

    expect(emittedCustomer).toEqual(mockCustomer);
  });

  it('should configure routerLink targeting customer detail view', () => {
    const simulateBtn: HTMLAnchorElement = fixture.nativeElement.querySelector('.simulate-btn');
    expect(simulateBtn.getAttribute('href')).toBe('/customers/cust-123');
  });
});
