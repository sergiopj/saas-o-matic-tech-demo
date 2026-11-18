import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CustomerLite } from '../../../customers/models/customer.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

/**
 * Reusable touch- and drag-enabled responsive carousel component.
 * Displays lightweight customer cards with sliding track and flanking arrow controls.
 */
@Component({
  selector: 'app-customer-carousel',
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './customer-carousel.component.html',
  styleUrl: './customer-carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerCarouselComponent implements OnInit, OnDestroy {
  readonly customers = input.required<CustomerLite[]>();

  readonly currentSlideIndex = signal<number>(0);
  readonly visibleCardsCount = signal<number>(3);
  readonly isDragging = signal<boolean>(false);

  readonly maxSlideIndex = computed<number>(() => {
    const total = this.customers().length;
    const visible = this.visibleCardsCount();
    return Math.max(0, total - visible);
  });

  private touchStartX = 0;
  private dragStartX = 0;
  private readonly resizeHandler = () => this.updateVisibleCount();

  ngOnInit(): void {
    this.updateVisibleCount();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.resizeHandler);
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  slideNext(): void {
    const step = this.visibleCardsCount();
    this.currentSlideIndex.update((curr) => Math.min(curr + step, this.maxSlideIndex()));
  }

  slidePrev(): void {
    const step = this.visibleCardsCount();
    this.currentSlideIndex.update((curr) => {
      const remainder = curr % step;
      const decrement = remainder === 0 ? step : remainder;
      return Math.max(curr - decrement, 0);
    });
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

  onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return;
    this.isDragging.set(true);
    this.dragStartX = event.clientX;
  }

  onMouseUp(event: MouseEvent): void {
    if (!this.isDragging()) return;
    this.isDragging.set(false);
    const diff = this.dragStartX - event.clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        this.slideNext();
      } else {
        this.slidePrev();
      }
    }
  }

  onMouseLeave(): void {
    if (this.isDragging()) {
      this.isDragging.set(false);
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
}
