import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CustomerEmailDialogComponent } from './customer-email-dialog.component';
import { Customer } from '../../models/customer.model';

describe('CustomerEmailDialogComponent', () => {
  let component: CustomerEmailDialogComponent;
  let fixture: ComponentFixture<CustomerEmailDialogComponent>;

  const mockCustomer: Customer = {
    id: 'cust-1',
    companyName: 'Acme International',
    taxId: 'B12345678',
    country: 'ES',
    email: 'billing@acme.com',
    selectedPlan: 'ENTERPRISE',
    createdAt: new Date().toISOString(),
  };

  const mockDialogRef = {
    close: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerEmailDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { customer: mockCustomer } },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerEmailDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with customer email and interpolated subject & body', () => {
    expect(component.recipient()).toBe('billing@acme.com');
    expect(component.subject()).toContain('Acme International');
    expect(component.body()).toContain('Acme International');
    expect(component.body()).toContain('ENTERPRISE');
  });

  it('should allow modifying subject and body dynamically', () => {
    component.subject.set('Customized Subject');
    component.body.set('Customized Body Message');

    expect(component.subject()).toBe('Customized Subject');
    expect(component.body()).toBe('Customized Body Message');
  });

  it('should copy formatted text to clipboard and trigger feedback', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    });

    await component.copyTemplate();

    expect(writeTextSpy).toHaveBeenCalledWith(
      expect.stringContaining('Subject: ')
    );
    expect(component.copied()).toBe(true);
  });

  it('should dispatch mailto URI on openMailClient and close dialog', () => {
    const originalHref = window.location.href;
    component.openMailClient();

    expect(mockDialogRef.close).toHaveBeenCalledWith('dispatched');
  });

  it('should close dialog when cancel/close is called', () => {
    component.close();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
