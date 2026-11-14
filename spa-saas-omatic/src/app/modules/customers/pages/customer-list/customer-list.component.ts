import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CustomerApiService } from '../../services/customer-api.service';
import { Customer } from '../../models/customer.model';
import { CustomerSearchBarComponent } from '../../components/customer-search-bar/customer-search-bar.component';
import { CustomerCardComponent } from '../../components/customer-card/customer-card.component';
import { ErrorBannerComponent } from '../../../../shared/components/error-banner/error-banner.component';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-customer-list',
  imports: [
    CustomerSearchBarComponent,
    CustomerCardComponent,
    ErrorBannerComponent,
    LoadingStateComponent,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
  ],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss',
})
export class CustomerListComponent implements OnInit {
  readonly customerApi = inject(CustomerApiService);

  readonly customers = signal<Customer[]>([]);
  readonly searchTerm = signal<string>('');
  readonly initialLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(term?: string): void {
    this.customerApi.search(term).subscribe({
      next: (data) => {
        this.customers.set(data);
        this.initialLoading.set(false);
      },
      error: () => {
        this.initialLoading.set(false);
      },
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.loadCustomers(term);
  }

  onClearSearch(): void {
    this.searchTerm.set('');
    this.loadCustomers();
  }
}
