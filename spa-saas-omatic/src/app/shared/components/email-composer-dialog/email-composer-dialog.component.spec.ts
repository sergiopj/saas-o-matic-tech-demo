import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { vi } from 'vitest';
import {
  EmailComposerDialogComponent,
  EmailComposerDialogData,
} from './email-composer-dialog.component';

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

  beforeEach(async () => {
    mockDialogRef.close.mockClear();

    await TestBed.configureTestingModule({
      imports: [EmailComposerDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmailComposerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize with recipient, subject, and formatted HTML body', () => {
    expect(component.recipient()).toBe('corporate@acme.com');
    expect(component.subject()).toBe('SaaS-O-Matic Proposal');
    expect(component.bodyHtml()).toContain('Hello Acme team');
  });

  it('should allow modifying subject and recipient dynamically', () => {
    component.subject.set('Updated Commercial Offer');
    component.recipient.set('contact@acme.com');

    expect(component.subject()).toBe('Updated Commercial Offer');
    expect(component.recipient()).toBe('contact@acme.com');
  });

  it('should format text via document.execCommand and focus editor', () => {
    const mockExec = vi.fn().mockReturnValue(true);
    (document as any).execCommand = mockExec;

    component.format('bold');

    expect(mockExec).toHaveBeenCalledWith('bold', false, undefined);
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

  it('should compute well-formed mailto URI adhering to RFC 6068 without %40 in recipient', () => {
    const uri = component.mailtoUri();

    expect(uri).toContain('mailto:corporate@acme.com?');
    expect(uri).not.toContain('mailto:corporate%40acme.com');
    expect(uri).toContain('subject=SaaS-O-Matic%20Proposal');
    expect(uri).toContain('body=');
  });

  it('should open Gmail Web in a new tab on openGmailWeb', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

    component.openGmailWeb();

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('mail.google.com/mail/?view=cm'),
      '_blank',
      'noopener,noreferrer'
    );
    expect(mockDialogRef.close).toHaveBeenCalledWith('dispatched');
    openSpy.mockRestore();
  });

  it('should dispatch mailto URI on openMailClient and close dialog after timeout', () => {
    vi.useFakeTimers();
    component.openMailClient();

    vi.advanceTimersByTime(400);

    expect(mockDialogRef.close).toHaveBeenCalledWith('dispatched');
    vi.useRealTimers();
  });

  it('should close dialog when cancel/close is called', () => {
    component.close();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
