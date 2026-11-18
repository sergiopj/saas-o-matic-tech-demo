import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
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
import { CustomerCarouselComponent } from '../../components/customer-carousel/customer-carousel.component';

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
    CustomerCarouselComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly customerApi = inject(CustomerApiService);
  readonly currencyService = inject(CurrencyService);

  readonly recentCustomers = signal<CustomerLite[]>([]);
  readonly totalCustomers = signal<number>(0);
  readonly supportedCountriesCount = SUPPORTED_FISCAL_COUNTRIES.length;

  // Real-time synchronized counters and radial clock-sweep angles
  readonly displayedCustomers = signal<number>(0);
  readonly displayedCountries = signal<number>(0);
  readonly displayedTiers = signal<number>(0);

  readonly customersFillAngle = signal<number>(0);
  readonly countriesFillAngle = signal<number>(0);
  readonly tiersFillAngle = signal<number>(0);

  private readonly animationFrameIds: number[] = [];

  ngOnInit(): void {
    this.loadRecentCustomers();
    this.animateKpi(
      this.supportedCountriesCount,
      (val) => this.displayedCountries.set(val),
      (deg) => this.countriesFillAngle.set(deg)
    );
    this.animateKpi(
      3,
      (val) => this.displayedTiers.set(val),
      (deg) => this.tiersFillAngle.set(deg)
    );
  }

  ngOnDestroy(): void {
    for (const id of this.animationFrameIds) {
      cancelAnimationFrame(id);
    }
    this.animationFrameIds.length = 0;
  }

  loadRecentCustomers(): void {
    this.customerApi.getRecentLite(12).subscribe({
      next: (res) => {
        this.recentCustomers.set(res.items);
        this.totalCustomers.set(res.total);
        this.animateKpi(
          res.total,
          (val) => this.displayedCustomers.set(val),
          (deg) => this.customersFillAngle.set(deg)
        );
      },
    });
  }

  /**
   * Synchronously animates a numeric KPI value and its corresponding 360-degree
   * radial conic clock-sweep background using hardware-friendly requestAnimationFrame.
   */
  animateKpi(
    targetVal: number,
    setValue: (val: number) => void,
    setAngle: (angle: number) => void,
    durationMs = 1400
  ): void {
    if (typeof window === 'undefined' || durationMs <= 0) {
      setValue(targetVal);
      setAngle(360);
      return;
    }

    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      setValue(targetVal);
      setAngle(360);
      return;
    }

    const startTime = performance.now();

    const frameStep = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      // Cubic ease-out: smooth deceleration approaching target
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      setValue(Math.round(targetVal * easeProgress));
      setAngle(Math.round(easeProgress * 360));

      if (progress < 1) {
        const id = requestAnimationFrame(frameStep);
        this.animationFrameIds.push(id);
      } else {
        setValue(targetVal);
        setAngle(360);
      }
    };

    const id = requestAnimationFrame(frameStep);
    this.animationFrameIds.push(id);
  }
}
