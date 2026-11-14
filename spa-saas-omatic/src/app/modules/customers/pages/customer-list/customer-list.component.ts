import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CustomerApiService } from '../../services/customer-api.service';
import { Customer } from '../../models/customer.model';
import { CustomerSearchBarComponent } from '../../components/customer-search-bar/customer-search-bar.component';
import { CustomerCardComponent } from '../../components/customer-card/customer-card.component';
import { ErrorBannerComponent } from '../../../../shared/components/error-banner/error-banner.component';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { getCountryFlag } from '../../../../shared/utils/country-flag.util';

export interface CountryFilterOption {
  code: string;
  flag: string;
  count: number;
}

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
  readonly selectedCountry = signal<string>('ALL');
  readonly initialLoading = signal<boolean>(true);

  readonly countryFilters = computed<CountryFilterOption[]>(() => {
    const list = this.customers();
    const counts = new Map<string, number>();

    for (const c of list) {
      if (c.country) {
        counts.set(c.country, (counts.get(c.country) ?? 0) + 1);
      }
    }

    const uniqueCountries = Array.from(counts.keys()).sort();

    return [
      { code: 'ALL', flag: '🌐', count: list.length },
      ...uniqueCountries.map((code) => ({
        code,
        flag: getCountryFlag(code),
        count: counts.get(code) ?? 0,
      })),
    ];
  });

  readonly filteredCustomers = computed<Customer[]>(() => {
    const country = this.selectedCountry();
    const list = this.customers();

    if (country === 'ALL') {
      return list;
    }
    return list.filter((c) => c.country === country);
  });

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

  selectCountry(countryCode: string): void {
    this.selectedCountry.set(countryCode);
  }
}
