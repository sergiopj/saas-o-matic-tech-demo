import { Component, ElementRef, effect, inject, signal } from '@angular/core';
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
import { I18nService } from '../../../core/services/i18n.service';
import { TranslationKey } from '../../../core/i18n/translations';

export interface EmailComposerDialogData {
  recipient: string;
  recipientName?: string;
  subtitle?: string;
  subject?: string;
  body?: string;
  htmlBody?: string;
}

export interface EmailComposerDialogResult {
  sent: boolean;
  recipient?: string;
  messageId?: string;
}

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
  private readonly i18n = inject(I18nService);
  private readonly elementRef = inject(ElementRef);

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
  readonly errorMessage = signal<string | null>(null);
  readonly copied = signal<boolean>(false);

  private quillInstance: unknown = null;

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

    effect(() => {
      this.i18n.currentLanguage();
      if (this.quillInstance) {
        this.setupToolbarTooltips(this.quillInstance);
      }
    });
  }

  onEditorCreated(quill: unknown): void {
    this.quillInstance = quill;
    this.setupToolbarTooltips(quill);
  }

  setupToolbarTooltips(quill?: unknown): void {
    const host = this.elementRef.nativeElement as HTMLElement;
    const q = quill as {
      container?: HTMLElement;
      getModule?: (name: string) => { container?: HTMLElement };
    } | null | undefined;

    const toolbarEl =
      q?.container?.parentElement?.querySelector<HTMLElement>('.ql-toolbar') ??
      q?.getModule?.('toolbar')?.container ??
      host.querySelector<HTMLElement>('.ql-toolbar');

    if (!toolbarEl) {
      return;
    }

    const toolbarItems: Array<{ selector: string; key: TranslationKey }> = [
      { selector: 'button.ql-bold', key: 'customers.emailDialog.toolbar.bold' },
      { selector: 'button.ql-italic', key: 'customers.emailDialog.toolbar.italic' },
      { selector: 'button.ql-underline', key: 'customers.emailDialog.toolbar.underline' },
      { selector: 'button.ql-strike', key: 'customers.emailDialog.toolbar.strike' },
      { selector: 'button.ql-list[value="ordered"]', key: 'customers.emailDialog.toolbar.orderedList' },
      { selector: 'button.ql-list[value="bullet"]', key: 'customers.emailDialog.toolbar.bulletList' },
      { selector: '.ql-header .ql-picker-label, select.ql-header', key: 'customers.emailDialog.toolbar.heading' },
      { selector: 'button.ql-clean', key: 'customers.emailDialog.toolbar.clean' },
    ];

    for (const item of toolbarItems) {
      const el = toolbarEl.querySelector<HTMLElement>(item.selector);
      if (el) {
        const tooltip = this.i18n.t(item.key);
        el.dataset['tooltip'] = tooltip;
        el.setAttribute('title', tooltip);
        el.setAttribute('aria-label', tooltip);
        if (!el.hasAttribute('tabindex')) {
          el.setAttribute('tabindex', '0');
        }
      }
    }
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
          this.dialogRef.close({
            sent: true,
            recipient: to,
            messageId: res.messageId,
          });
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
