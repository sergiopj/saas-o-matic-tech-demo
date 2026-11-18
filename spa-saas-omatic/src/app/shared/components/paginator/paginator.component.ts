import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-paginator',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    TranslatePipe,
  ],
  templateUrl: './paginator.component.html',
  styleUrl: './paginator.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginatorComponent {
  /** Total number of items across all pages */
  readonly totalItems = input.required<number>();

  /** Current 1-based page index */
  readonly currentPage = model<number>(1);

  /** Items per page */
  readonly pageSize = model<number>(5);

  /** Available page size options */
  readonly pageSizeOptions = input<number[]>([5, 10, 20]);

  /** Whether controls are disabled */
  readonly disabled = input<boolean>(false);

  /** ARIA label for navigation landmark */
  readonly ariaLabel = input<string>('Paginación');

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / this.pageSize()))
  );

  readonly displayedRange = computed(() => {
    const total = this.totalItems();
    if (total === 0) {
      return { start: 0, end: 0, total: 0 };
    }
    const start = (this.currentPage() - 1) * this.pageSize() + 1;
    const end = Math.min(total, this.currentPage() * this.pageSize());
    return { start, end, total };
  });

  readonly visiblePageNumbers = computed<number[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.currentPage.set(page);
    }
  }

  onPageSizeChange(size: number): void {
    if (size > 0 && size !== this.pageSize()) {
      this.pageSize.set(size);
      this.currentPage.set(1);
    }
  }
}
