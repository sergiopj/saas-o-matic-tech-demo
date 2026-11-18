import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export const DEFAULT_SPINNER_DIAMETER = 44;
export const DEFAULT_SPINNER_STROKE_WIDTH = 4;

@Component({
  selector: 'app-loading-state',
  imports: [MatProgressSpinnerModule],
  templateUrl: './loading-state.component.html',
  styleUrl: './loading-state.component.scss',
})
export class LoadingStateComponent {
  readonly message = input<string>('');
  readonly diameter = input<number>(DEFAULT_SPINNER_DIAMETER);
  readonly strokeWidth = input<number>(DEFAULT_SPINNER_STROKE_WIDTH);
}
