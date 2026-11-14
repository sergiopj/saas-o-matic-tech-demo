import { Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Customer } from '../../models/customer.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { CustomerEmailDialogComponent } from '../customer-email-dialog/customer-email-dialog.component';

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
    MatDialogModule,
    MatTooltipModule,
    TranslatePipe,
  ],
  templateUrl: './customer-card.component.html',
  styleUrl: './customer-card.component.scss',
})
export class CustomerCardComponent {
  private readonly dialog = inject(MatDialog);

  readonly customer = input.required<Customer>();
  readonly selectCustomer = output<Customer>();

  onSimulate(): void {
    this.selectCustomer.emit(this.customer());
  }

  openEmailComposer(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();

    this.dialog.open(CustomerEmailDialogComponent, {
      data: { customer: this.customer() },
      width: '600px',
      maxWidth: '92vw',
      panelClass: 'roams-email-dialog-panel',
    });
  }
}
