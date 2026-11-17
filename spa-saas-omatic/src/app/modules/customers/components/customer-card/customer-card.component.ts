import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Customer } from '../../models/customer.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { EmailComposerDialogComponent } from '../../../../shared/components/email-composer-dialog/email-composer-dialog.component';
import { I18nService } from '../../../../core/services/i18n.service';

/**
 * Presentational card component rendering corporate customer details,
 * ISO country badge, direct email composer trigger, and simulation navigation.
 */
@Component({
  selector: 'app-customer-card',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe,
  ],
  templateUrl: './customer-card.component.html',
  styleUrl: './customer-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerCardComponent {
  private readonly dialog = inject(MatDialog);
  private readonly i18n = inject(I18nService);

  readonly customer = input.required<Customer>();
  readonly selectCustomer = output<Customer>();

  onSimulate(): void {
    this.selectCustomer.emit(this.customer());
  }

  openEmailComposer(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    const cust = this.customer();

    this.dialog.open(EmailComposerDialogComponent, {
      data: {
        recipient: cust.email,
        recipientName: cust.companyName,
        subtitle: cust.country,
        subject: this.i18n.t('customers.emailDialog.defaultSubject', {
          company: cust.companyName,
        }),
        body: this.i18n.t('customers.emailDialog.defaultBody', {
          company: cust.companyName,
          plan: cust.selectedPlan,
        }),
      },
      width: '640px',
      maxWidth: '94vw',
      panelClass: 'roams-email-dialog-panel',
    });
  }
}
