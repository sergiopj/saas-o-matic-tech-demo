import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CustomerApiService } from '../../../customers/services/customer-api.service';
import { Customer } from '../../../customers/models/customer.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

/**
 * Simulations Hub landing page.
 * Provides guidance on tiered pricing logic, quick account selection,
 * and direct routing to customer-specific simulation studios.
 */
@Component({
  selector: 'app-simulation-hub',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    TranslatePipe,
  ],
  templateUrl: './simulation-hub.component.html',
  styleUrl: './simulation-hub.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimulationHubComponent implements OnInit {
  private readonly router = inject(Router);
  readonly customerApi = inject(CustomerApiService);

  readonly customers = signal<Customer[]>([]);
  readonly selectedCustomerId = signal<string>('');

  ngOnInit(): void {
    this.customerApi.search(undefined, undefined, 1, 50, 'companyName', 'ASC').subscribe({
      next: (res) => {
        this.customers.set(res.items);
      },
    });
  }

  onSelectCustomer(id: string): void {
    this.selectedCustomerId.set(id);
  }

  goToSimulation(): void {
    const id = this.selectedCustomerId();
    if (id) {
      void this.router.navigate(['/customers', id]);
    }
  }
}
