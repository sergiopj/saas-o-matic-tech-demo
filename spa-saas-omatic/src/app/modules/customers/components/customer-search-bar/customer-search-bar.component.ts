import { Component, OnDestroy, input, output, signal } from '@angular/core';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-customer-search-bar',
  imports: [MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule, TranslatePipe],
  templateUrl: './customer-search-bar.component.html',
  styleUrl: './customer-search-bar.component.scss',
})
export class CustomerSearchBarComponent implements OnDestroy {
  readonly initialValue = input<string>('');
  readonly searchChange = output<string>();

  protected readonly query = signal<string>('');

  private readonly searchSubject = new Subject<string>();
  private readonly subscription: Subscription;

  constructor() {
    this.subscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.searchChange.emit(term);
      });
  }

  onInput(value: string): void {
    this.query.set(value);
    this.searchSubject.next(value);
  }

  clear(): void {
    this.query.set('');
    this.searchSubject.next('');
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.searchSubject.complete();
  }
}
