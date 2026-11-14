import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-state',
  imports: [MatProgressSpinnerModule],
  templateUrl: './loading-state.component.html',
  styleUrl: './loading-state.component.scss',
})
export class LoadingStateComponent {
  readonly message = input<string>('');
  readonly diameter = input<number>(44);
  readonly strokeWidth = input<number>(4);
}
