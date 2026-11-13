import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [I18nService],
    });
    service = TestBed.inject(I18nService);
  });

  it('should initialize with a supported language', () => {
    expect(['es', 'en']).toContain(service.currentLanguage());
  });

  it('should translate keys correctly in Spanish', () => {
    service.setLanguage('es');
    expect(service.t('currency.sync.loading')).toBe('Actualizando tipos de cambio en vivo...');
    expect(service.t('currency.sync.error')).toContain('contingencia');
  });

  it('should translate keys correctly in English when switched', () => {
    service.setLanguage('en');
    expect(service.t('currency.sync.loading')).toBe('Updating live exchange rates...');
    expect(service.t('currency.sync.error')).toContain('Exchange rates API unavailable');
  });

  it('should toggle language reactively', () => {
    service.setLanguage('es');
    expect(service.currentLanguage()).toBe('es');
    service.setLanguage('en');
    expect(service.currentLanguage()).toBe('en');
  });
});
