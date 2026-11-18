import { Injectable, computed, signal } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import localeEn from '@angular/common/locales/en';
import localeDe from '@angular/common/locales/de';
import localeFr from '@angular/common/locales/fr';
import { getSafeStorageItem, setSafeStorageItem } from '../utils/storage.util';
import {
  SupportedLanguage,
  TranslationKey,
  TRANSLATIONS,
  SUPPORTED_LANGUAGES,
  LanguageOption,
} from '../i18n/translations';

registerLocaleData(localeEs, 'es');
registerLocaleData(localeEn, 'en');
registerLocaleData(localeDe, 'de');
registerLocaleData(localeFr, 'fr');


@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly initialLang: SupportedLanguage = this.detectLanguage();

  readonly currentLanguage = signal<SupportedLanguage>(this.initialLang);
  readonly languages: readonly LanguageOption[] = SUPPORTED_LANGUAGES;

  readonly currentFlag = computed(() => {
    return this.languages.find((l) => l.code === this.currentLanguage())?.flag ?? '🌐';
  });

  /**
   * Translates a dictionary key into the active language, optionally interpolating
   * placeholder parameters formatted as {{key}}.
   *
   * @param key Translation key from the catalog
   * @param params Optional key-value record for token replacement
   */
  t(key: TranslationKey, params?: Record<string, string | number>): string {
    const lang = this.currentLanguage();
    const dict = TRANSLATIONS[lang] ?? TRANSLATIONS['es'];
    let text: string = dict?.[key] ?? (TRANSLATIONS['es']?.[key] as string | undefined) ?? key;

    if (params) {
      for (const [paramKey, value] of Object.entries(params)) {
        text = text.replaceAll(`{{${paramKey}}}`, String(value));
      }
    }

    return text;
  }

  setLanguage(lang: SupportedLanguage): void {
    if (lang in TRANSLATIONS) {
      this.currentLanguage.set(lang);
      setSafeStorageItem('saas_omatic_lang', lang);
    }
  }

  private detectLanguage(): SupportedLanguage {
    const stored = getSafeStorageItem('saas_omatic_lang') as SupportedLanguage | null;
    if (stored && stored in TRANSLATIONS) {
      return stored;
    }

    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserCode = navigator.language.slice(0, 2).toLowerCase();
      if (browserCode in TRANSLATIONS) {
        return browserCode as SupportedLanguage;
      }
    }
    return 'es';
  }
}
