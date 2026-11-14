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
import { Customer } from '../../models/customer.model';
import { I18nService } from '../../../../core/services/i18n.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

export interface CustomerEmailDialogData {
  customer: Customer;
}

/**
 * Enterprise dialog component for drafting, customizing, and dispatching
 * localized commercial proposals directly to the customer's contact email.
 */
@Component({
  selector: 'app-customer-email-dialog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './customer-email-dialog.component.html',
  styleUrl: './customer-email-dialog.component.scss',
})
export class CustomerEmailDialogComponent {
  readonly data = inject<CustomerEmailDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<CustomerEmailDialogComponent>);
  private readonly i18n = inject(I18nService);

  readonly recipient = signal<string>(this.data.customer.email);

  readonly subject = signal<string>(
    this.i18n.t('customers.emailDialog.defaultSubject', {
      company: this.data.customer.companyName,
    })
  );

  readonly body = signal<string>(
    this.i18n.t('customers.emailDialog.defaultBody', {
      company: this.data.customer.companyName,
      plan: this.data.customer.selectedPlan,
    })
  );

  readonly copied = signal<boolean>(false);

  /**
   * Constructs an RFC 6068 mailto URI with sanitized query parameters
   * and triggers the operating system's default email client.
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
   * Copies the full subject and formatted message to clipboard with visual feedback.
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
