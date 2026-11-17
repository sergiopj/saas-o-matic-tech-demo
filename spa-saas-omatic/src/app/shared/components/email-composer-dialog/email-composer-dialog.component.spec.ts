import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import {
  EmailComposerDialogComponent,
  EmailComposerDialogData,
} from './email-composer-dialog.component';
import { EmailApiService } from '../../../core/services/email-api.service';

describe('EmailComposerDialogComponent', () => {
  let component: EmailComposerDialogComponent;
  let fixture: ComponentFixture<EmailComposerDialogComponent>;

  const mockData: EmailComposerDialogData = {
    recipient: 'corporate@acme.com',
    recipientName: 'Acme International',
    subtitle: 'ES',
    subject: 'SaaS-O-Matic Proposal',
    body: 'Hello Acme team,\n\nWe have prepared your proposal.',
  };

  const mockDialogRef = {
    close: vi.fn(),
  };

  const mockEmailApi = {
    sendEmail: vi.fn(),
  };

  beforeEach(async () => {
    mockDialogRef.close.mockClear();
    mockEmailApi.sendEmail.mockReset();

    await TestBed.configureTestingModule({
      imports: [EmailComposerDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: EmailApiService, useValue: mockEmailApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailComposerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with recipient, subject, and htmlBody', () => {
    expect(component.recipient()).toBe('corporate@acme.com');
    expect(component.subject()).toBe('SaaS-O-Matic Proposal');
    expect(component.htmlBody()).toContain('Hello Acme team');
  });

  it('should call emailApi.sendEmail on sendEmail and close dialog after timeout', () => {
    vi.useFakeTimers();
    mockEmailApi.sendEmail.mockReturnValue(
      of({
        success: true,
        messageId: 'msg-999',
        recipient: 'corporate@acme.com',
        subject: 'SaaS-O-Matic Proposal',
        sanitizedBodyLength: 45,
        dispatchedAt: new Date().toISOString(),
      })
    );

    component.sendEmail();

    expect(mockEmailApi.sendEmail).toHaveBeenCalledWith({
      to: 'corporate@acme.com',
      subject: 'SaaS-O-Matic Proposal',
      htmlBody: expect.stringContaining('Hello Acme team'),
    });
    expect(component.sendSuccess()).toBe(true);

    vi.advanceTimersByTime(800);
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      sent: true,
      recipient: 'corporate@acme.com',
      messageId: 'msg-999',
    });
    vi.useRealTimers();
  });

  it('should display error message when emailApi fails', () => {
    mockEmailApi.sendEmail.mockReturnValue(
      throwError(() => ({ error: { detail: 'SMTP Gateway Timeout' } }))
    );

    component.sendEmail();

    expect(component.isSending()).toBe(false);
    expect(component.errorMessage()).toBe('SMTP Gateway Timeout');
    expect(mockDialogRef.close).not.toHaveBeenCalled();
  });

  it('should copy text to clipboard and trigger copied signal', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    });

    await component.copyTemplate();

    expect(writeTextSpy).toHaveBeenCalledWith(
      expect.stringContaining('Subject: SaaS-O-Matic Proposal')
    );
    expect(component.copied()).toBe(true);
  });

  it('should close dialog when cancel/close is called', () => {
    component.close();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should validate recipient email in real time and reject invalid formats', () => {
    expect(component.recipientControl.valid).toBe(true);

    component.recipientControl.setValue('');
    expect(component.recipientControl.valid).toBe(false);
    expect(component.recipientControl.hasError('required')).toBe(true);

    component.recipientControl.setValue('not-an-email');
    expect(component.recipientControl.valid).toBe(false);
    expect(component.recipientControl.hasError('pattern')).toBe(true);

    component.recipientControl.setValue('user@domain');
    expect(component.recipientControl.valid).toBe(false);
    expect(component.recipientControl.hasError('pattern')).toBe(true);

    component.recipientControl.setValue('valid.user@company.es');
    expect(component.recipientControl.valid).toBe(true);
    expect(component.recipient()).toBe('valid.user@company.es');
  });

  it('should not dispatch email when recipientControl is invalid', () => {
    component.recipientControl.setValue('invalid-email');
    component.sendEmail();

    expect(mockEmailApi.sendEmail).not.toHaveBeenCalled();
    expect(component.isSending()).toBe(false);
  });
});
