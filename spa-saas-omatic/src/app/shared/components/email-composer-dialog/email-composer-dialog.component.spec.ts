import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import {
  EmailComposerDialogComponent,
  EmailComposerDialogData,
} from './email-composer-dialog.component';
import { EmailApiService } from '../../../core/services/email-api.service';
import { I18nService } from '../../../core/services/i18n.service';

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

    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('es');

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

  it('should configure tooltips and aria-labels for toolbar buttons on editor created', () => {
    const toolbar = document.createElement('div');
    toolbar.className = 'ql-toolbar';
    const boldBtn = document.createElement('button');
    boldBtn.className = 'ql-bold';
    const italicBtn = document.createElement('button');
    italicBtn.className = 'ql-italic';
    const orderedListBtn = document.createElement('button');
    orderedListBtn.className = 'ql-list';
    orderedListBtn.setAttribute('value', 'ordered');
    const headerPicker = document.createElement('span');
    headerPicker.className = 'ql-header';
    const headerLabel = document.createElement('span');
    headerLabel.className = 'ql-picker-label';
    headerPicker.appendChild(headerLabel);

    toolbar.appendChild(boldBtn);
    toolbar.appendChild(italicBtn);
    toolbar.appendChild(orderedListBtn);
    toolbar.appendChild(headerPicker);

    const mockQuill = {
      container: {
        parentElement: {
          querySelector: vi.fn((sel: string) => (sel === '.ql-toolbar' ? toolbar : null)),
        },
      },
    };

    component.onEditorCreated(mockQuill);

    expect(boldBtn.getAttribute('data-tooltip')).toBe('Negrita (Ctrl+B)');
    expect(boldBtn.getAttribute('aria-label')).toBe('Negrita (Ctrl+B)');
    expect(boldBtn.getAttribute('title')).toBe('Negrita (Ctrl+B)');
    expect(boldBtn.getAttribute('tabindex')).toBe('0');

    expect(italicBtn.getAttribute('data-tooltip')).toBe('Cursiva (Ctrl+I)');
    expect(orderedListBtn.getAttribute('data-tooltip')).toBe('Lista numerada');
    expect(headerLabel.getAttribute('data-tooltip')).toBe('Encabezado');
  });

  it('should safely handle null or missing toolbar without throwing errors', () => {
    expect(() => component.setupToolbarTooltips(null)).not.toThrow();
    expect(() => component.setupToolbarTooltips(undefined)).not.toThrow();
    expect(() => component.setupToolbarTooltips({})).not.toThrow();
  });

  it('should update toolbar tooltips when active language changes', () => {
    const i18n = TestBed.inject(I18nService);
    const toolbar = document.createElement('div');
    toolbar.className = 'ql-toolbar';
    const boldBtn = document.createElement('button');
    boldBtn.className = 'ql-bold';
    toolbar.appendChild(boldBtn);

    const mockQuill = {
      container: {
        parentElement: {
          querySelector: vi.fn(() => toolbar),
        },
      },
    };

    component.onEditorCreated(mockQuill);
    expect(boldBtn.getAttribute('data-tooltip')).toBe('Negrita (Ctrl+B)');

    i18n.setLanguage('en');
    fixture.detectChanges();

    expect(boldBtn.getAttribute('data-tooltip')).toBe('Bold (Ctrl+B)');
    expect(boldBtn.getAttribute('aria-label')).toBe('Bold (Ctrl+B)');
  });

  it('should initialize with htmlBody when passed directly in data', () => {
    const customFixture = TestBed.createComponent(EmailComposerDialogComponent);
    const customComp = customFixture.componentInstance;
    (customComp as any).data = {
      recipient: 'direct@acme.com',
      htmlBody: '<p>Direct HTML</p>',
      subject: 'Custom Subject',
    };
    expect((customComp as any).initHtmlBody()).toBe('<p>Direct HTML</p>');
  });

  it('should return empty string if neither body nor htmlBody are provided', () => {
    const customFixture = TestBed.createComponent(EmailComposerDialogComponent);
    const customComp = customFixture.componentInstance;
    (customComp as any).data = {
      recipient: 'direct@acme.com',
      subject: 'Custom Subject',
    };
    expect((customComp as any).initHtmlBody()).toBe('');
  });

  it('should not dispatch email if subject or htmlBody are empty', () => {
    component.subject.set('   ');
    component.sendEmail();
    expect(mockEmailApi.sendEmail).not.toHaveBeenCalled();

    component.subject.set('Valid Subject');
    component.htmlBody.set('   ');
    component.sendEmail();
    expect(mockEmailApi.sendEmail).not.toHaveBeenCalled();
  });

  it('should fall back to err.message or generic message when err.error.detail is absent', () => {
    mockEmailApi.sendEmail.mockReturnValue(
      throwError(() => ({ message: 'Network offline' }))
    );
    component.sendEmail();
    expect(component.errorMessage()).toBe('Network offline');

    mockEmailApi.sendEmail.mockReturnValue(
      throwError(() => ({}))
    );
    component.sendEmail();
    expect(component.errorMessage()).toBe('Could not dispatch email. Please try again.');
  });
});
