import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailComposerService, CustomerEmailTarget } from './email-composer.service';
import { I18nService } from './i18n.service';
import {
  EmailComposerDialogComponent,
  EmailComposerDialogData,
} from '../../shared/components/email-composer-dialog/email-composer-dialog.component';

describe('EmailComposerService', () => {
  let service: EmailComposerService;
  let dialogSpy: { open: ReturnType<typeof vi.fn> };
  let snackBarSpy: { open: ReturnType<typeof vi.fn> };
  let i18nService: I18nService;

  const mockCustomer: CustomerEmailTarget = {
    email: 'finance@acme.com',
    companyName: 'Acme Corp',
    country: 'ES',
    selectedPlan: 'Enterprise Plus',
  };

  beforeEach(() => {
    dialogSpy = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(undefined),
      }),
    };

    snackBarSpy = {
      open: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        EmailComposerService,
        I18nService,
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
      ],
    });

    service = TestBed.inject(EmailComposerService);
    i18nService = TestBed.inject(I18nService);
    i18nService.setLanguage('en');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should open dialog for customer with standardized templates and options', () => {
    service.openForCustomer(mockCustomer);

    expect(dialogSpy.open).toHaveBeenCalledWith(
      EmailComposerDialogComponent,
      expect.objectContaining({
        data: expect.objectContaining({
          recipient: 'finance@acme.com',
          recipientName: 'Acme Corp',
          subtitle: 'ES',
          subject: expect.stringContaining('Acme Corp'),
          body: expect.stringContaining('Enterprise Plus'),
        }),
        width: '640px',
        maxWidth: '94vw',
        panelClass: 'roams-email-dialog-panel',
      })
    );
  });

  it('should allow overriding subject or body when calling openForCustomer', () => {
    service.openForCustomer(mockCustomer, {
      subject: 'Custom Tailored Subject',
    });

    expect(dialogSpy.open).toHaveBeenCalledWith(
      EmailComposerDialogComponent,
      expect.objectContaining({
        data: expect.objectContaining({
          recipient: 'finance@acme.com',
          subject: 'Custom Tailored Subject',
        }),
      })
    );
  });

  it('should show success snackbar toast when dialog closes with sent: true', () => {
    dialogSpy.open.mockReturnValue({
      afterClosed: () => of({ sent: true, recipient: 'finance@acme.com', messageId: 'msg-1' }),
    });

    service.openForCustomer(mockCustomer);

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      i18nService.t('customers.emailDialog.sentSuccess'),
      'OK',
      expect.objectContaining({
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      })
    );
  });

  it('should NOT trigger snackbar toast when dialog is cancelled or sent is falsy', () => {
    dialogSpy.open.mockReturnValue({
      afterClosed: () => of(undefined),
    });

    service.openForCustomer(mockCustomer);

    expect(snackBarSpy.open).not.toHaveBeenCalled();
  });

  it('should open dialog with raw custom data and options via open()', () => {
    dialogSpy.open.mockReturnValue({
      afterClosed: () => of({ sent: true }),
    });

    const customData: EmailComposerDialogData = {
      recipient: 'direct@roams.es',
      recipientName: 'Roams Direct',
      subject: 'Custom Direct Notification',
      body: 'Hello direct message',
    };

    service.open(customData, { width: '700px' });

    expect(dialogSpy.open).toHaveBeenCalledWith(
      EmailComposerDialogComponent,
      expect.objectContaining({
        data: customData,
        width: '700px',
        maxWidth: '94vw',
        panelClass: 'roams-email-dialog-panel',
      })
    );
    expect(snackBarSpy.open).toHaveBeenCalled();
  });
});
