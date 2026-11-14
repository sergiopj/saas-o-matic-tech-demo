import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { TranslationKey } from '../../core/i18n/translations';

@Pipe({
  name: 'translate',
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: TranslationKey | string | null | undefined): string {
    if (!key) return '';
    return this.i18n.t(key as TranslationKey);
  }
}
