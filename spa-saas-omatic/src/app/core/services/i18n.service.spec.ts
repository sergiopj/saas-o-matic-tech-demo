import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';
import { SUPPORTED_LANGUAGES } from '../i18n/translations';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [I18nService],
    });
    service = TestBed.inject(I18nService);
  });

  it('should initialize with a supported language from the configured catalog', () => {
    const supportedCodes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(supportedCodes).toContain(service.currentLanguage());
  });

  it('should expose the full list of supported languages from project configuration', () => {
    expect(service.languages).toEqual(SUPPORTED_LANGUAGES);
  });

  it('should switch language reactively and provide valid translations for all catalog languages', () => {
    SUPPORTED_LANGUAGES.forEach(({ code, flag }) => {
      service.setLanguage(code);
      expect(service.currentLanguage()).toBe(code);
      expect(service.currentFlag()).toBe(flag);
      expect(service.t('navbar.title')).toBe('SaaS-O-Matic');
      expect(service.t('currency.sync.loading')).toBeTruthy();
      expect(service.t('error.communication.title')).toBeTruthy();
    });
  });

  it('should ignore unsupported languages and preserve current language', () => {
    service.setLanguage(SUPPORTED_LANGUAGES[0].code);
    service.setLanguage('unsupported' as any);
    expect(service.currentLanguage()).toBe(SUPPORTED_LANGUAGES[0].code);
  });
});
