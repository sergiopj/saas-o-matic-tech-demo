import { TestBed } from '@angular/core/testing';
import { TranslatePipe } from './translate.pipe';
import { I18nService } from '../../core/services/i18n.service';

describe('TranslatePipe', () => {
  let pipe: TranslatePipe;
  let i18nService: I18nService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TranslatePipe, I18nService],
    });

    pipe = TestBed.inject(TranslatePipe);
    i18nService = TestBed.inject(I18nService);
    i18nService.setLanguage('es');
  });

  it('should create the translate pipe', () => {
    expect(pipe).toBeTruthy();
  });

  it('should translate key to Spanish by default', () => {
    const result = pipe.transform('customers.card.simulate.btn');
    expect(result).toBe('Simular Suscripción');
  });

  it('should reactively update translation when language is switched to English', () => {
    expect(pipe.transform('customers.card.simulate.btn')).toBe('Simular Suscripción');

    i18nService.setLanguage('en');
    expect(pipe.transform('customers.card.simulate.btn')).toBe('Simulate Subscription');
  });

  it('should return empty string if key is null or undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('should return original key string if key is not present in dictionary', () => {
    const unknownKey = 'unknown.translation.key' as any;
    expect(pipe.transform(unknownKey)).toBe('unknown.translation.key');
  });
});
