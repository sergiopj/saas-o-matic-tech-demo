import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { QuillEditorComponent } from 'ngx-quill';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { EmailApiService } from '../../../core/services/email-api.service';

export interface EmailComposerDialogData {
  recipient: string;
  recipientName?: string;
  subtitle?: string;
  subject?: string;
  body?: string;
  htmlBody?: string;
}

/**
 * Enterprise dialog for drafting, rich-text editing (Quill WYSIWYG), and dispatching
 * commercial proposals and notifications directly to the backend POST /emails endpoint.
 */
@Component({
  selector: 'app-email-composer-dialog',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    QuillEditorComponent,
    TranslatePipe,
  ],
  templateUrl: './email-composer-dialog.component.html',
  styleUrl: './email-composer-dialog.component.scss',
})
export class EmailComposerDialogComponent {
  readonly data = inject<EmailComposerDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<EmailComposerDialogComponent>);
  private readonly emailApi = inject(EmailApiService);

  readonly errorMatcher = new ShowOnDirtyErrorStateMatcher();

  /**
   * Pragmatic RFC 5322 regex requiring valid local part, domain name, and at least a 2-char TLD.
   */
  readonly recipientControl = new FormControl<string>(this.data.recipient || '', {
    nonNullable: true,
    validators: [
      (control) => Validators.required(control),
      Validators.pattern(
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
      ),
    ],
  });

  readonly recipient = signal<string>(this.data.recipient || '');
  readonly subject = signal<string>(this.data.subject || '');
  readonly htmlBody = signal<string>(this.initHtmlBody());
  readonly isSending = signal<boolean>(false);
  readonly sendSuccess = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly copied = signal<boolean>(false);

  readonly quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ header: [1, 2, 3, false] }],
      ['clean'],
    ],
  };

  constructor() {
    this.recipientControl.valueChanges.subscribe((value) => {
      this.recipient.set(value);
    });
  }

  private initHtmlBody(): string {
    if (this.data.htmlBody) {
      return this.data.htmlBody;
    }
    if (this.data.body) {
      return this.data.body
        .split('\n\n')
        .map((p) => `<p>${p.replaceAll('\n', '<br>')}</p>`)
        .join('');
    }
    return '';
  }

  sendEmail(): void {
    if (this.recipientControl.invalid) {
      this.recipientControl.markAsTouched();
      this.recipientControl.markAsDirty();
      return;
    }

    const to = this.recipientControl.value.trim();
    const subject = this.subject().trim();
    const htmlBody = this.htmlBody().trim();

    if (!to || !subject || !htmlBody) {
      return;
    }

    this.isSending.set(true);
    this.errorMessage.set(null);

    this.emailApi
      .sendEmail({
        to,
        subject,
        htmlBody,
      })
      .subscribe({
        next: (res) => {
          this.isSending.set(false);
          this.sendSuccess.set(true);
          setTimeout(() => {
            this.dialogRef.close({
              sent: true,
              recipient: to,
              messageId: res.messageId,
            });
          }, 800);
        },
        error: (err) => {
          this.isSending.set(false);
          this.errorMessage.set(
            err?.error?.detail || err?.message || 'Could not dispatch email. Please try again.'
          );
        },
      });
  }

  async copyTemplate(): Promise<void> {
    const plainText = `Subject: ${this.subject()}\n\n${this.htmlBody().replace(/<[^<>]*>/g, '')}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(plainText);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
