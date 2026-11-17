import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface EmailComposerDialogData {
  recipient: string;
  recipientName?: string;
  subtitle?: string;
  subject?: string;
  body?: string;
}

/**
 * Universal, modular enterprise dialog for composing and dispatching
 * commercial proposals or communications.
 * Fully decoupled in shared/components with native RFC 6068 mailto dispatch
 * and clipboard copy backup.
 */
@Component({
  selector: 'app-email-composer-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './email-composer-dialog.component.html',
  styleUrl: './email-composer-dialog.component.scss',
})
export class EmailComposerDialogComponent {
  readonly data = inject<EmailComposerDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<EmailComposerDialogComponent>);

  readonly recipient = signal<string>(this.data.recipient || '');
  readonly subject = signal<string>(this.data.subject || '');
  readonly body = signal<string>(this.data.body || '');
  readonly copied = signal<boolean>(false);

  /**
   * Constructs an RFC 6068 mailto URI and triggers the operating system's default email client.
   */
  openMailClient(): void {
    const to = encodeURIComponent(this.recipient());
    const subjectParam = encodeURIComponent(this.subject());
    const bodyParam = encodeURIComponent(this.body());
    const mailtoUri = `mailto:${to}?subject=${subjectParam}&body=${bodyParam}`;

    if (typeof window !== 'undefined') {
      window.location.href = mailtoUri;
    }

    this.dialogRef.close('dispatched');
  }

  /**
   * Copies the full subject and message to clipboard with visual feedback.
   */
  async copyTemplate(): Promise<void> {
    const fullText = `Subject: ${this.subject()}\n\n${this.body()}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(fullText);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
