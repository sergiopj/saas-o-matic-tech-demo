import { Component, inject, input, output } from '@angular/core';
import { ProblemDetail } from '../../../core/errors/problem-detail.model';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-error-banner',
  templateUrl: './error-banner.component.html',
  styleUrl: './error-banner.component.scss',
})
export class ErrorBannerComponent {
  readonly problem = input<ProblemDetail | null>(null);
  readonly dismissable = input<boolean>(true);
  readonly dismiss = output<void>();

  readonly i18n = inject(I18nService);

  onDismiss(): void {
    this.dismiss.emit();
  }
}
