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

  it('should initialize with recipient, subject, and body', () => {
    expect(component.recipient()).toBe('corporate@acme.com');
    expect(component.subject()).toBe('SaaS-O-Matic Proposal');
    expect(component.body()).toContain('Hello Acme team');
  });

  it('should allow modifying subject and body dynamically', () => {
    component.subject.set('Updated Commercial Offer');
    component.body.set('Updated message text');

    expect(component.subject()).toBe('Updated Commercial Offer');
    expect(component.body()).toBe('Updated message text');
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

  it('should dispatch mailto URI on openMailClient and close dialog after delay', () => {
    vi.useFakeTimers();
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');

    component.openMailClient();

    expect(appendChildSpy).toHaveBeenCalled();
    expect(component.isDispatching()).toBe(true);

    vi.advanceTimersByTime(400);

    expect(mockDialogRef.close).toHaveBeenCalledWith('dispatched');
    expect(component.isDispatching()).toBe(false);
    appendChildSpy.mockRestore();
    vi.useRealTimers();
  });

  it('should close dialog when cancel/close is called', () => {
    component.close();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
