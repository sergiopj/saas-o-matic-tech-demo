import { Component, inject, computed } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CurrencyService } from '../../../core/services/currency.service';
import { I18nService } from '../../../core/services/i18n.service';
import { CurrencyCode } from '../../../core/models/currency.model';

@Component({
  selector: 'app-currency-selector',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './currency-selector.component.html',
  styleUrl: './currency-selector.component.scss',
})
export class CurrencySelectorComponent {
  private readonly currencyService = inject(CurrencyService);
  protected readonly i18n = inject(I18nService);

  readonly selectedCurrency = this.currencyService.selectedCurrency;
  readonly options = this.currencyService.currencyOptions;
  readonly loading = this.currencyService.loading;
  readonly error = this.currencyService.error;

  readonly statusTooltip = computed(() => {
    if (this.loading()) {
      return this.i18n.t('currency.sync.loading');
    }
    if (this.error()) {
      return this.i18n.t('currency.sync.error');
    }
    return this.i18n.t('currency.sync.synced');
  });

  onCurrencyChange(code: CurrencyCode): void {
    this.currencyService.setCurrency(code);
  }
}
