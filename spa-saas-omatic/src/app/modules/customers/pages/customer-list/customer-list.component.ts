import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CustomerApiService } from '../../services/customer-api.service';
import {
  Customer,
  CustomerSortBy,
  SortOrder,
  SUPPORTED_FISCAL_COUNTRIES,
} from '../../models/customer.model';
import { CustomerSearchBarComponent } from '../../components/customer-search-bar/customer-search-bar.component';
import { CustomerCardComponent } from '../../components/customer-card/customer-card.component';
import { CustomerCreateDialogComponent } from '../../components/customer-create-dialog/customer-create-dialog.component';
import { ErrorBannerComponent } from '../../../../shared/components/error-banner/error-banner.component';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { I18nService } from '../../../../core/services/i18n.service';
import { TranslationKey } from '../../../../core/i18n/translations';
import { ToastService } from '../../../../core/services/toast.service';

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
    PaginatorComponent,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerListComponent implements OnInit {
  readonly customerApi = inject(CustomerApiService);
  private readonly dialog = inject(MatDialog);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);

  readonly customers = signal<Customer[]>([]);
  readonly searchTerm = signal<string>('');
  readonly selectedCountry = signal<string>('ALL');
  readonly initialLoading = signal<boolean>(true);

  readonly isSearchingText = computed<boolean>(
    () => this.customerApi.loading() && Boolean(this.searchTerm().trim()),
  );

  readonly availableCountries = signal<readonly string[]>(
    SUPPORTED_FISCAL_COUNTRIES,
  );

  readonly sortOptions = CUSTOMER_SORT_OPTIONS;
  readonly activeSortKey = signal<string>('recent');

  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(8);
  readonly pageSizeOptions = [8, 12, 24];
  readonly totalCount = signal<number>(0);

  readonly countryFilters = computed<CountryFilterOption[]>(() => [
    {
      code: 'ALL',
      label: this.i18n.t('customers.filter.allCountries'),
    },
    ...SUPPORTED_FISCAL_COUNTRIES.map((code) => ({
      code,
      label: `${code} - ${this.i18n.t(`countries.${code}` as TranslationKey)}`,
    })),
  ]);

  readonly totalPages = computed<number>(() =>
    Math.max(1, Math.ceil(this.totalCount() / this.pageSize()))
  );

  // Backward-compatible aliases for templates and unit tests
  readonly totalFiltered = computed<number>(() => this.totalCount());
  readonly filteredCustomers = computed<Customer[]>(() => this.customers());
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

  ngOnInit(): void {
    this.loadCustomers();
  }

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
    this.currentPage.set(1);
    this.loadCustomers();
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.currentPage.set(1);
    this.loadCustomers();
  }

  onClearSearch(): void {
    this.searchTerm.set('');
    this.currentPage.set(1);
    this.loadCustomers();
  }

  selectCountry(countryCode: string): void {
    this.selectedCountry.set(countryCode);
    this.currentPage.set(1);
    this.loadCustomers();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.currentPage.set(page);
      this.loadCustomers();
    }
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.currentPage.set(1);
    this.loadCustomers();
  }

  openCreateCustomerDialog(): void {
    const dialogRef = this.dialog.open(CustomerCreateDialogComponent, {
      width: '660px',
      maxWidth: '95vw',
    });

    dialogRef.afterClosed().subscribe((createdCustomer: Customer | undefined) => {
      if (createdCustomer) {
        this.currentPage.set(1);
        this.loadCustomers();
        this.toast.success(this.i18n.t('customers.create.success'));
      }
    });
  }
}
