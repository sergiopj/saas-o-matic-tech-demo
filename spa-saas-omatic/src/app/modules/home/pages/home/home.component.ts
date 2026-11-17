import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
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

  // Responsive Carousel Slide Signals
  readonly currentSlideIndex = signal<number>(0);
  readonly visibleCardsCount = signal<number>(3);

  readonly maxSlideIndex = computed(() => {
    const total = this.recentCustomers().length;
    const visible = this.visibleCardsCount();
    return Math.max(0, total - visible);
  });

  private touchStartX = 0;
  private readonly animationFrameIds: number[] = [];
  private readonly resizeHandler = () => this.updateVisibleCount();

  ngOnInit(): void {
    this.updateVisibleCount();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.resizeHandler);
    }
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
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeHandler);
    }
    for (const id of this.animationFrameIds) {
      cancelAnimationFrame(id);
    }
    this.animationFrameIds.length = 0;
  }

  loadRecentCustomers(): void {
    this.customerApi.getRecentLite(8).subscribe({
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

  slideNext(): void {
    this.currentSlideIndex.update((curr) => Math.min(curr + 1, this.maxSlideIndex()));
  }

  slidePrev(): void {
    this.currentSlideIndex.update((curr) => Math.max(curr - 1, 0));
  }

  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].clientX;
  }

  onTouchEnd(event: TouchEvent): void {
    const touchEndX = event.changedTouches[0].clientX;
    const diff = this.touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        this.slideNext();
      } else {
        this.slidePrev();
      }
    }
  }

  private updateVisibleCount(): void {
    if (typeof window === 'undefined') return;
    const width = window.innerWidth;
    if (width < 640) {
      this.visibleCardsCount.set(1);
    } else if (width < 1024) {
      this.visibleCardsCount.set(2);
    } else {
      this.visibleCardsCount.set(3);
    }
    if (this.currentSlideIndex() > this.maxSlideIndex()) {
      this.currentSlideIndex.set(this.maxSlideIndex());
    }
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
