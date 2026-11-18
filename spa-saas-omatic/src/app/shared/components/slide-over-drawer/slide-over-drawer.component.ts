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
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * Generic reusable slide-over drawer (offcanvas modal) component.
 * Supports content projection for header actions, body content (e.g. dynamic filters),
 * and sticky footer actions. Accessible with W3C dialog semantics and ESC key handling.
 */
@Component({
  selector: 'app-slide-over-drawer',
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, TranslatePipe],
  templateUrl: './slide-over-drawer.component.html',
  styleUrl: './slide-over-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlideOverDrawerComponent {
  readonly isOpen = model<boolean>(false);

  readonly title = input<string>('');

  readonly subtitle = input<string | null>(null);

  readonly closeAriaLabel = input<string | null>(null);

  readonly icon = input<string>('tune');

  readonly position = input<'right' | 'left'>('right');

  readonly width = input<string>('440px');

  readonly hasBackdrop = input<boolean>(true);

  readonly closeOnBackdrop = input<boolean>(true);

  readonly closeOnEscape = input<boolean>(true);

  readonly closed = output<void>();

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
