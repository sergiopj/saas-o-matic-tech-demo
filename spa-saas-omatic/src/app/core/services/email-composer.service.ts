import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { I18nService } from './i18n.service';
import {
  EmailComposerDialogComponent,
  EmailComposerDialogData,
  EmailComposerDialogResult,
} from '../../shared/components/email-composer-dialog/email-composer-dialog.component';

export interface CustomerEmailTarget {
  email: string;
  companyName: string;
  country?: string;
  selectedPlan?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmailComposerService {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly i18n = inject(I18nService);

  openForCustomer(
    customer: CustomerEmailTarget,
    overrides?: Partial<EmailComposerDialogData>
  ): MatDialogRef<EmailComposerDialogComponent, EmailComposerDialogResult> {
    const dialogData: EmailComposerDialogData = {
      recipient: customer.email,
      recipientName: customer.companyName,
      subtitle: customer.country,
      subject: this.i18n.t('customers.emailDialog.defaultSubject', {
        company: customer.companyName,
      }),
      body: this.i18n.t('customers.emailDialog.defaultBody', {
        company: customer.companyName,
        plan: customer.selectedPlan ?? '',
      }),
      ...overrides,
    };

    return this.open(dialogData);
  }

  open(
    data: EmailComposerDialogData,
    config?: Partial<MatDialogConfig<EmailComposerDialogData>>
  ): MatDialogRef<EmailComposerDialogComponent, EmailComposerDialogResult> {
    const dialogRef = this.dialog.open<
      EmailComposerDialogComponent,
      EmailComposerDialogData,
      EmailComposerDialogResult
    >(EmailComposerDialogComponent, {
      data,
      width: '640px',
      maxWidth: '94vw',
      maxHeight: '94vh',
      panelClass: 'roams-email-dialog-panel',
      ...config,
    });

    this.subscribeToDialogClose(dialogRef);
    return dialogRef;
  }

  private subscribeToDialogClose(
    dialogRef: MatDialogRef<EmailComposerDialogComponent, EmailComposerDialogResult>
  ): void {
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.sent) {
        this.showSuccessToast();
      }
    });
  }

  private showSuccessToast(): void {
    this.snackBar.open(this.i18n.t('customers.emailDialog.sentSuccess'), 'OK', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }
}
