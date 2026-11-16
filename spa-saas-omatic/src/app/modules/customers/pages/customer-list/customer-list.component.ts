import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CustomerApiService } from '../../services/customer-api.service';
import {
  Customer,
  CustomerSortBy,
  SortOrder,
  SUPPORTED_FISCAL_COUNTRIES,
} from '../../models/customer.model';
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

export interface SortOptionItem {
  key: string;
  labelKey: string;
  sortBy: CustomerSortBy;
  order: SortOrder;
}

export const CUSTOMER_SORT_OPTIONS: readonly SortOptionItem[] = [
  {
    key: 'recent',
    labelKey: 'customers.sort.recent',
    sortBy: 'createdAt',
    order: 'DESC',
  },
  {
    key: 'oldest',
    labelKey: 'customers.sort.oldest',
    sortBy: 'createdAt',
    order: 'ASC',
  },
  {
    key: 'name_asc',
    labelKey: 'customers.sort.nameAsc',
    sortBy: 'companyName',
    order: 'ASC',
  },
  {
    key: 'name_desc',
    labelKey: 'customers.sort.nameDesc',
    sortBy: 'companyName',
    order: 'DESC',
  },
] as const;

/**
 * Smart page component orchestrating customer retrieval, debounced search,
 * server-side fiscal jurisdiction filtering, multi-parameter sorting, and reactive UI updates.
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerListComponent implements OnInit {
  readonly customerApi = inject(CustomerApiService);
  private readonly i18n = inject(I18nService);

  readonly customers = signal<Customer[]>([]);
  readonly searchTerm = signal<string>('');
  readonly selectedCountry = signal<string>('ALL');
  readonly initialLoading = signal<boolean>(true);

  // Centralized fiscal country registry
  readonly availableCountries = signal<readonly string[]>(
    SUPPORTED_FISCAL_COUNTRIES,
  );

  // Server-Side Sorting state
  readonly sortOptions = CUSTOMER_SORT_OPTIONS;
  readonly activeSortKey = signal<string>('recent');

  // Pure Server-Side Pagination state
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(6);
  readonly pageSizeOptions = [6, 12, 24];
  readonly totalCount = signal<number>(0);

  /**
   * Computes available country filter options using the canonical SSOT constants.
   */
  readonly countryFilters = computed<CountryFilterOption[]>(() => {
    return [
      {
        code: 'ALL',
        label: this.i18n.t('customers.filter.allCountries'),
      },
      ...SUPPORTED_FISCAL_COUNTRIES.map((code) => ({
        code,
        label: code,
      })),
    ];
  });

  readonly totalFiltered = computed<number>(() => this.totalCount());

  /**
   * Filtered list alias for backward compatibility and tests.
   */
  readonly filteredCustomers = computed<Customer[]>(() => this.customers());

  readonly totalPages = computed<number>(() =>
    Math.max(1, Math.ceil(this.totalCount() / this.pageSize()))
  );

  /**
   * Under pure server-side pagination, the server only returns the current page's slice.
   * This keeps DOM rendering minimal (e.g. 12 cards max) with zero client-side memory bloat.
   */
  readonly paginatedCustomers = computed<Customer[]>(() => this.customers());

  readonly displayedRange = computed<{
    start: number;
    end: number;
    total: number;
  }>(() => {
    const total = this.totalCount();
    if (total === 0) return { start: 0, end: 0, total: 0 };
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end = Math.min(this.currentPage() * this.pageSize(), total);
    return { start, end, total };
  });

  readonly visiblePageNumbers = computed<number[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const delta = 2;
    const min = Math.max(1, current - delta);
    const max = Math.min(total, current + delta);
    const pages: number[] = [];
    for (let i = min; i <= max; i++) {
      pages.push(i);
    }
    return pages;
  });

  ngOnInit(): void {
    this.loadCustomers();
  }

  /**
   * Dispatches pure server-side paginated and sorted queries to the backend API.
   * Only fetches the slice of records corresponding to the requested page and sort order.
   */
  loadCustomers(
    page?: number,
    pageSize?: number,
    term?: string,
    country?: string,
    sortKey?: string,
  ): void {
    const activePage = page ?? this.currentPage();
    const activeSize = pageSize ?? this.pageSize();
    const activeTerm = term ?? this.searchTerm();
    const activeCountry = country ?? this.selectedCountry();
    const currentSortKey = sortKey ?? this.activeSortKey();
    const sortConfig =
      CUSTOMER_SORT_OPTIONS.find((opt) => opt.key === currentSortKey) ??
      CUSTOMER_SORT_OPTIONS[0];

    this.customerApi
      .search(
        activeTerm,
        activeCountry,
        activePage,
        activeSize,
        sortConfig.sortBy,
        sortConfig.order,
      )
      .subscribe({
        next: (response) => {
          this.customers.set(response.items);
          this.totalCount.set(response.total);
          this.currentPage.set(activePage);
          this.pageSize.set(activeSize);
          this.initialLoading.set(false);
        },
        error: () => {
          this.initialLoading.set(false);
        },
      });
  }

  onSortChange(newSortKey: string): void {
    this.activeSortKey.set(newSortKey);
    this.loadCustomers(
      1,
      this.pageSize(),
      this.searchTerm(),
      this.selectedCountry(),
      newSortKey,
    );
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.loadCustomers(1, this.pageSize(), term, this.selectedCountry());
  }

  onClearSearch(): void {
    this.searchTerm.set('');
    this.loadCustomers(1, this.pageSize(), '', this.selectedCountry());
  }

  selectCountry(countryCode: string): void {
    this.selectedCountry.set(countryCode);
    this.loadCustomers(1, this.pageSize(), this.searchTerm(), countryCode);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.loadCustomers(
        page,
        this.pageSize(),
        this.searchTerm(),
        this.selectedCountry(),
      );
    }
  }

  onPageSizeChange(newSize: number): void {
    this.loadCustomers(
      1,
      newSize,
      this.searchTerm(),
      this.selectedCountry(),
    );
  }
}
