import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  model,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Generic reusable slide-over drawer (offcanvas modal) component.
 * Supports content projection for header actions, body content (e.g. dynamic filters),
 * and sticky footer actions. Accessible with W3C dialog semantics and ESC key handling.
 */
@Component({
  selector: 'app-slide-over-drawer',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './slide-over-drawer.component.html',
  styleUrl: './slide-over-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlideOverDrawerComponent {
  /** Two-way bindable open/closed state */
  readonly isOpen = model<boolean>(false);

  /** Drawer header title */
  readonly title = input<string>('Filtros');

  /** Drawer header optional descriptive subtitle */
  readonly subtitle = input<string | null>(null);

  /** Material icon identifier in header */
  readonly icon = input<string>('tune');

  /** Drawer position: right (default) or left */
  readonly position = input<'right' | 'left'>('right');

  /** Desktop drawer width (e.g. 440px) */
  readonly width = input<string>('440px');

  /** Whether to render an overlay backdrop */
  readonly hasBackdrop = input<boolean>(true);

  /** Whether clicking the backdrop closes the drawer */
  readonly closeOnBackdrop = input<boolean>(true);

  /** Whether pressing Escape closes the drawer */
  readonly closeOnEscape = input<boolean>(true);

  /** Emitted when the drawer closes */
  readonly closed = output<void>();

  /** Emitted when the drawer opens */
  readonly opened = output<void>();

  @HostListener('keydown.escape', ['$event'])
  onEscape(event: Event): void {
    if (this.isOpen() && this.closeOnEscape()) {
      event.stopPropagation();
      this.close();
    }
  }

  close(): void {
    if (this.isOpen()) {
      this.isOpen.set(false);
      this.closed.emit();
    }
  }

  open(): void {
    if (!this.isOpen()) {
      this.isOpen.set(true);
      this.opened.emit();
    }
  }

  onBackdropClick(): void {
    if (this.closeOnBackdrop()) {
      this.close();
    }
  }
}
