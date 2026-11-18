import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
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
  let mockCustomerApi: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

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
      update: vi.fn().mockReturnValue(of(sampleCustomer)),
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

  it('should render 3D corporate customer badge image in dialog header with localized alt text', () => {
    const badgeImg: HTMLImageElement | null = fixture.nativeElement.querySelector('.header-badge-img');
    expect(badgeImg).toBeTruthy();
    expect(badgeImg?.getAttribute('src')).toBe('images/corporate-customer-badge.jpg');
    expect(badgeImg?.getAttribute('alt')).toBeTruthy();
  });

  it('should invalidate incorrect Spanish CIF and validate correct AEAT CIF', () => {
    const taxControl = component.form.get('taxId');
    taxControl?.setValue('B12345678'); // Invalid control
    expect(taxControl?.hasError('invalidTaxId')).toBe(true);
    expect(taxControl?.hasError('invalidSpanishTaxId')).toBe(true);

    taxControl?.setValue('B12345674'); // Valid AEAT CIF
    expect(taxControl?.hasError('invalidTaxId')).toBe(false);
    expect(taxControl?.hasError('invalidSpanishTaxId')).toBe(false);
  });

  it('should adapt taxId validation and placeholder when country changes to international jurisdiction', () => {
    const countryControl = component.form.get('country');
    const taxControl = component.form.get('taxId');

    expect(component.taxIdPlaceholder()).toContain('B12345674');

    taxControl?.setValue('DE999888777');
    expect(taxControl?.hasError('invalidTaxId')).toBe(true); // invalid under ES
    expect(taxControl?.hasError('invalidSpanishTaxId')).toBe(true);

    countryControl?.setValue('DE');
    expect(component.taxIdPlaceholder()).toContain('DE999888777');
    expect(taxControl?.hasError('invalidTaxId')).toBe(false); // valid under DE

    // Short ID under DE gives invalidInternationalTaxId
    taxControl?.setValue('B1');
    expect(taxControl?.hasError('invalidTaxId')).toBe(true);
    expect(taxControl?.hasError('invalidInternationalTaxId')).toBe(true);

    // Spanish CIF B12345674 is valid under ES, but switching country to DE must immediately invalidate it
    countryControl?.setValue('ES');
    taxControl?.setValue('B12345674');
    expect(taxControl?.valid).toBe(true);

    countryControl?.setValue('DE');
    expect(taxControl?.hasError('invalidTaxId')).toBe(true);
    expect(taxControl?.hasError('invalidInternationalTaxId')).toBe(true);
    expect(taxControl?.dirty).toBe(true);
  });

  it('should interpolate country-specific placeholder example in invalidInternationalTaxId error message', () => {
    const countryControl = component.form.get('country');
    const taxControl = component.form.get('taxId');

    countryControl?.setValue('FR');
    expect(component.taxIdExample()).toBe('FR45801234567');
    expect(component.taxIdPlaceholder()).toContain('FR45801234567');

    taxControl?.setValue('F');
    taxControl?.markAsDirty();
    fixture.detectChanges();

    expect(taxControl?.hasError('invalidInternationalTaxId')).toBe(true);

    const errorEl = fixture.nativeElement.querySelector('mat-error');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('FR45801234567');
    expect(errorEl.textContent).not.toContain('DE999888777');
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

  it('should submit valid payload, set success state, and close dialog immediately', () => {
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
    expect(mockDialogRef.close).toHaveBeenCalledWith(sampleCustomer);
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

  it('should render translated aria-label on close button', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('es');
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.close-btn');
    expect(closeBtn.getAttribute('aria-label')).toBe('Cerrar diálogo de alta');

    i18n.setLanguage('en');
    fixture.detectChanges();
    expect(closeBtn.getAttribute('aria-label')).toBe('Close dialog');
  });

  describe('Edit Mode', () => {
    let editComponent: CustomerCreateDialogComponent;
    let editFixture: ComponentFixture<CustomerCreateDialogComponent>;

    beforeEach(() => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CustomerCreateDialogComponent],
        providers: [
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: CustomerApiService, useValue: mockCustomerApi },
          { provide: MAT_DIALOG_DATA, useValue: sampleCustomer },
          I18nService,
        ],
      });

      editFixture = TestBed.createComponent(CustomerCreateDialogComponent);
      editComponent = editFixture.componentInstance;
      editFixture.detectChanges();
    });

    it('should prefill form with existing customer data in edit mode', () => {
      expect(editComponent.isEditMode()).toBe(true);
      expect(editComponent.form.get('companyName')?.value).toBe('Acme Solutions S.L.');
      expect(editComponent.form.get('taxId')?.value).toBe('B12345674');
      expect(editComponent.form.get('country')?.value).toBe('ES');
      expect(editComponent.form.get('email')?.value).toBe('billing@acme.es');
      expect(editComponent.form.get('selectedPlan')?.value).toBe('Growth Pro');
      expect(editComponent.form.valid).toBe(true);
    });

    it('should call customerApi.update instead of create when submitting in edit mode and close dialog immediately', () => {
      editComponent.form.patchValue({
        companyName: 'Acme Solutions Updated',
      });

      editComponent.onSubmit();

      expect(mockCustomerApi.update).toHaveBeenCalledWith('cust-uuid-1', {
        companyName: 'Acme Solutions Updated',
        taxId: 'B12345674',
        country: 'ES',
        email: 'billing@acme.es',
        selectedPlan: 'Growth Pro',
      });
      expect(mockCustomerApi.create).not.toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalledWith(sampleCustomer);
    });
  });
});
