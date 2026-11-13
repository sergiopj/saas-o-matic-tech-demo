import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyService } from '../../../../../../../core/services/currency.service';
import { CURRENCY_METADATA, CurrencyCode } from '../../../../../../../core/models/currency.model';

@Pipe({
    name: 'localizedCurrency',
    standalone: true,
    pure: false,
})
export class LocalizedCurrencyPipe implements PipeTransform {
    private readonly currencyService = inject(CurrencyService);

    transform(amountInEur: number | null | undefined, overrideCurrency?: CurrencyCode): string {
        if (amountInEur === null || amountInEur === undefined || isNaN(amountInEur)) {
            return '—';
        }

        const currency = overrideCurrency ?? this.currencyService.selectedCurrency();
        const converted = this.currencyService.convert(amountInEur, currency);
        const meta = CURRENCY_METADATA[currency] ?? CURRENCY_METADATA.EUR;

        return new Intl.NumberFormat(meta.locale, {
            style: 'currency',
            currency,
            minimumFractionDigits: meta.decimals,
            maximumFractionDigits: meta.decimals,
        }).format(converted);
    }
}
