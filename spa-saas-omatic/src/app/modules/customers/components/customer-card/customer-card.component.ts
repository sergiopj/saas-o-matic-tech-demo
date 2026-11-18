import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Customer } from '../../models/customer.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { EmailComposerDialogComponent } from '../../../../shared/components/email-composer-dialog/email-composer-dialog.component';
import { I18nService } from '../../../../core/services/i18n.service';

@Component({
  selector: 'app-customer-card',
  imports: [
    DatePipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    TranslatePipe,
  ],
  templateUrl: './customer-card.component.html',
  styleUrl: './customer-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerCardComponent {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly i18n = inject(I18nService);

  readonly customer = input.required<Customer>();
  readonly selectCustomer = output<Customer>();

  readonly avatarInitial = computed(() =>
    this.customer().companyName.charAt(0).toUpperCase()
  );

  readonly planClass = computed(
    () => 'plan-' + this.customer().selectedPlan.toLowerCase()
  );

  onSimulate(): void {
    this.selectCustomer.emit(this.customer());
  }

  openEmailComposer(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    const selectedCustomer = this.customer();

    const dialogRef = this.dialog.open(EmailComposerDialogComponent, {
      data: {
        recipient: selectedCustomer.email,
        recipientName: selectedCustomer.companyName,
        subtitle: selectedCustomer.country,
        subject: this.i18n.t('customers.emailDialog.defaultSubject', {
          company: selectedCustomer.companyName,
        }),
        body: this.i18n.t('customers.emailDialog.defaultBody', {
          company: selectedCustomer.companyName,
          plan: selectedCustomer.selectedPlan,
        }),
      },
      width: '640px',
      maxWidth: '94vw',
      panelClass: 'roams-email-dialog-panel',
    });

    this.handleEmailDialogClose(dialogRef);
  }

  private handleEmailDialogClose(
    dialogRef: MatDialogRef<EmailComposerDialogComponent>
  ): void {
    dialogRef.afterClosed().subscribe((result: { sent?: boolean } | undefined) => {
      if (result?.sent) {
        this.showEmailSuccessToast();
      }
    });
  }

  private showEmailSuccessToast(): void {
    this.snackBar.open(this.i18n.t('customers.emailDialog.sentSuccess'), 'OK', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
