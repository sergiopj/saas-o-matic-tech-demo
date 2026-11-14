import { Injectable, computed, signal } from '@angular/core';
import {
  SupportedLanguage,
  TranslationKey,
  TRANSLATIONS,
  SUPPORTED_LANGUAGES,
  LanguageOption,
} from '../i18n/translations';

/**
 * Enterprise internationalization service managing reactive application locale,
 * browser language auto-detection, and dictionary interpolation.
 */
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
    let text: string = TRANSLATIONS[lang][key] ?? key;

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
    }
  }

  private detectLanguage(): SupportedLanguage {
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserCode = navigator.language.slice(0, 2).toLowerCase();
      if (browserCode in TRANSLATIONS) {
        return browserCode as SupportedLanguage;
      }
    }
    return 'es';
  }
}
