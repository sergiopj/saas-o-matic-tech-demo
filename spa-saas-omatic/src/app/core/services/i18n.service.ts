import { Injectable, computed, signal } from '@angular/core';
import {
  SupportedLanguage,
  TranslationKey,
  TRANSLATIONS,
  SUPPORTED_LANGUAGES,
  LanguageOption,
} from '../i18n/translations';

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

  t(key: TranslationKey): string {
    const lang = this.currentLanguage();
    return TRANSLATIONS[lang][key] ?? key;
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
