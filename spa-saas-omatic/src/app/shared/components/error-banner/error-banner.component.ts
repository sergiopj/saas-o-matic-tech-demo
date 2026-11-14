import { Component, input, output } from '@angular/core';
import { ProblemDetail } from '../../../core/errors/problem-detail.model';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-error-banner',
  imports: [TranslatePipe],
  templateUrl: './error-banner.component.html',
  styleUrl: './error-banner.component.scss',
})
export class ErrorBannerComponent {
  readonly problem = input<ProblemDetail | null>(null);
  readonly dismissable = input<boolean>(true);
  readonly dismiss = output<void>();

  onDismiss(): void {
    this.dismiss.emit();
  }
}
