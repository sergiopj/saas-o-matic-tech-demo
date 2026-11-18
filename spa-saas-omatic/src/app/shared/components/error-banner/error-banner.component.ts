import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ProblemDetail } from '../../../core/errors/problem-detail.model';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * Presentational component rendering standardized RFC 9457 Problem Details.
 */
@Component({
  selector: 'app-error-banner',
  imports: [MatIconModule, TranslatePipe],
  templateUrl: './error-banner.component.html',
  styleUrl: './error-banner.component.scss',
})
export class ErrorBannerComponent {
  readonly problem = input<ProblemDetail | null>(null);
  readonly dismissible = input<boolean>(true);
  readonly retryable = input<boolean>(false);

  readonly dismiss = output<void>();
  readonly retry = output<void>();

  onDismiss(): void {
    this.dismiss.emit();
  }

  onRetry(): void {
    this.retry.emit();
  }
}
