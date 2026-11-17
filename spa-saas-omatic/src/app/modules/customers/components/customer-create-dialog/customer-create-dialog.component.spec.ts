import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { CustomerCreateDialogComponent } from './customer-create-dialog.component';
import { CustomerApiService } from '../../services/customer-api.service';
import { I18nService } from '../../../../core/services/i18n.service';
import { Customer } from '../../models/customer.model';
import { ProblemDetail } from '../../../../core/errors/problem-detail.model';

describe('CustomerCreateDialogComponent', () => {
  let component: CustomerCreateDialogComponent;
  let fixture: ComponentFixture<CustomerCreateDialogComponent>;
  let mockDialogRef: { close: ReturnType<typeof vi.fn> };
  let mockCustomerApi: { create: ReturnType<typeof vi.fn> };

  const sampleCustomer: Customer = {
    id: 'cust-uuid-1',
    companyName: 'Acme Solutions S.L.',
    taxId: 'B12345674',
    country: 'ES',
    email: 'billing@acme.es',
    selectedPlan: 'Growth Pro',
    createdAt: '2026-11-17T12:00:00Z',
  };

  beforeEach(async () => {
    mockDialogRef = {
      close: vi.fn(),
    };

    mockCustomerApi = {
      create: vi.fn().mockReturnValue(of(sampleCustomer)),
    };

    await TestBed.configureTestingModule({
      imports: [CustomerCreateDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: CustomerApiService, useValue: mockCustomerApi },
        I18nService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerCreateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component and initialize the form with default values', () => {
    expect(component).toBeTruthy();
    expect(component.form.get('country')?.value).toBe('ES');
    expect(component.form.get('selectedPlan')?.value).toBe('Growth Pro');
    expect(component.form.valid).toBe(false); // required fields empty
  });

  it('should invalidate incorrect Spanish CIF and validate correct AEAT CIF', () => {
    const taxControl = component.form.get('taxId');
    taxControl?.setValue('B12345678'); // Invalid control
    expect(taxControl?.hasError('invalidTaxId')).toBe(true);

    taxControl?.setValue('B12345674'); // Valid AEAT CIF
    expect(taxControl?.hasError('invalidTaxId')).toBe(false);
  });

  it('should adapt taxId validation when country changes to international jurisdiction', () => {
    const countryControl = component.form.get('country');
    const taxControl = component.form.get('taxId');

    taxControl?.setValue('DE999888777');
    expect(taxControl?.hasError('invalidTaxId')).toBe(true); // invalid under ES

    countryControl?.setValue('DE');
    expect(taxControl?.hasError('invalidTaxId')).toBe(false); // valid under DE
  });

  it('should reject invalid RFC 5322 emails and accept valid ones', () => {
    const emailControl = component.form.get('email');
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('invalidEmailFormat')).toBe(true);

    emailControl?.setValue('billing@company.com');
    expect(emailControl?.hasError('invalidEmailFormat')).toBe(false);
  });

  it('should not submit if form is invalid and should mark controls dirty', () => {
    component.onSubmit();
    expect(mockCustomerApi.create).not.toHaveBeenCalled();
    expect(component.form.get('companyName')?.dirty).toBe(true);
    expect(component.form.get('taxId')?.dirty).toBe(true);
    expect(component.form.get('email')?.dirty).toBe(true);
  });

  it('should submit valid payload, set success state, and close dialog after timeout', () => {
    vi.useFakeTimers();

    component.form.setValue({
      companyName: ' Telefónica Soluciones S.A.U. ',
      country: 'ES',
      taxId: ' a-280 1083-3 ',
      email: ' CONTACTO@TELEFONICA.ES ',
      selectedPlan: 'Enterprise Scale',
    });

    expect(component.form.valid).toBe(true);

    component.onSubmit();

    expect(component.submitting()).toBe(false);
    expect(component.success()).toBe(true);
    expect(mockCustomerApi.create).toHaveBeenCalledWith({
      companyName: 'Telefónica Soluciones S.A.U.',
      country: 'ES',
      taxId: 'A28010833',
      email: 'contacto@telefonica.es',
      selectedPlan: 'Enterprise Scale',
    });

    vi.advanceTimersByTime(700);
    expect(mockDialogRef.close).toHaveBeenCalledWith(sampleCustomer);

    vi.useRealTimers();
  });

  it('should handle API error and display ProblemDetail message', () => {
    const problem: ProblemDetail = {
      type: 'https://problems/duplicate-tax-id',
      title: 'Tax ID Already Registered',
      status: 409,
      detail: 'A customer with tax ID B12345674 already exists.',
      instance: '/customers',
      timestamp: new Date().toISOString(),
    };

    mockCustomerApi.create.mockReturnValueOnce(throwError(() => problem));

    component.form.setValue({
      companyName: 'Acme Corp',
      country: 'ES',
      taxId: 'B12345674',
      email: 'admin@acme.es',
      selectedPlan: 'Growth Pro',
    });

    component.onSubmit();

    expect(component.submitting()).toBe(false);
    expect(component.errorMessage()).toBe('A customer with tax ID B12345674 already exists.');
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should close dialog when onCancel is invoked', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
