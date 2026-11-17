import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { CustomerApiService } from '../../../customers/services/customer-api.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { CustomerLite, SUPPORTED_FISCAL_COUNTRIES } from '../../../customers/models/customer.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { ErrorBannerComponent } from '../../../../shared/components/error-banner/error-banner.component';

/**
 * Executive Home Dashboard providing real-time KPIs, recently registered corporate accounts,
 * SaaS tiered pricing overview, and fast-track navigation to commercial simulation studios.
 */
@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    TranslatePipe,
    LoadingStateComponent,
    ErrorBannerComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  readonly customerApi = inject(CustomerApiService);
  readonly currencyService = inject(CurrencyService);

  readonly recentCustomers = signal<CustomerLite[]>([]);
  readonly totalCustomers = signal<number>(0);
  readonly supportedCountriesCount = SUPPORTED_FISCAL_COUNTRIES.length;

  ngOnInit(): void {
    this.loadRecentCustomers();
  }

  loadRecentCustomers(): void {
    this.customerApi.getRecentLite(4).subscribe({
      next: (res) => {
        this.recentCustomers.set(res.items);
        this.totalCustomers.set(res.total);
      },
    });
  }
}
