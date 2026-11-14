import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CustomerApiService } from '../../services/customer-api.service';
import { Customer } from '../../models/customer.model';
import { CustomerSearchBarComponent } from '../../components/customer-search-bar/customer-search-bar.component';
import { CustomerCardComponent } from '../../components/customer-card/customer-card.component';
import { ErrorBannerComponent } from '../../../../shared/components/error-banner/error-banner.component';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { I18nService } from '../../../../core/services/i18n.service';

export interface CountryFilterOption {
  code: string;
  label: string;
}

/**
 * Smart page component orchestrating customer retrieval, debounced search,
 * server-side fiscal jurisdiction filtering, and reactive UI updates.
 */
@Component({
  selector: 'app-customer-list',
  imports: [
    CustomerSearchBarComponent,
    CustomerCardComponent,
    ErrorBannerComponent,
    LoadingStateComponent,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss',
})
export class CustomerListComponent implements OnInit {
  readonly customerApi = inject(CustomerApiService);
  private readonly i18n = inject(I18nService);

  readonly customers = signal<Customer[]>([]);
  readonly searchTerm = signal<string>('');
  readonly selectedCountry = signal<string>('ALL');
  readonly initialLoading = signal<boolean>(true);
  readonly availableCountries = signal<string[]>([]);

  /**
   * Computes available country filter options.
   * Derived on initial catalog load and persists across server-side filter queries.
   */
  readonly countryFilters = computed<CountryFilterOption[]>(() => {
    return [
      {
        code: 'ALL',
        label: this.i18n.t('customers.filter.allCountries'),
      },
      ...this.availableCountries().map((code) => ({
        code,
        label: code,
      })),
    ];
  });

  /**
   * Customers already filtered server-side by the backend API.
   */
  readonly filteredCustomers = computed<Customer[]>(() => this.customers());

  ngOnInit(): void {
    this.loadCustomers();
  }

  /**
   * Dispatches server-side search and jurisdiction filter to the backend API.
   */
  loadCustomers(term?: string, country?: string): void {
    const activeTerm = term !== undefined ? term : this.searchTerm();
    const activeCountry = country !== undefined ? country : this.selectedCountry();

    this.customerApi.search(activeTerm, activeCountry).subscribe({
      next: (data) => {
        this.customers.set(data);
        if (this.initialLoading()) {
          const uniqueCountries = Array.from(
            new Set(data.map((c) => c.country).filter(Boolean))
          ).sort();
          this.availableCountries.set(uniqueCountries);
          this.initialLoading.set(false);
        }
      },
      error: () => {
        this.initialLoading.set(false);
      },
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.loadCustomers(term, this.selectedCountry());
  }

  onClearSearch(): void {
    this.searchTerm.set('');
    this.loadCustomers('', this.selectedCountry());
  }

  selectCountry(countryCode: string): void {
    this.selectedCountry.set(countryCode);
    this.loadCustomers(this.searchTerm(), countryCode);
  }
}
