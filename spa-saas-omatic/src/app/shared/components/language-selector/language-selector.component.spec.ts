import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguageSelectorComponent } from './language-selector.component';
import { I18nService } from '../../../core/services/i18n.service';
import { SUPPORTED_LANGUAGES } from '../../../core/i18n/translations';

describe('LanguageSelectorComponent', () => {
  let fixture: ComponentFixture<LanguageSelectorComponent>;
  let component: LanguageSelectorComponent;
  let i18nService: I18nService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageSelectorComponent],
      providers: [I18nService],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSelectorComponent);
    component = fixture.componentInstance;
    i18nService = TestBed.inject(I18nService);
    i18nService.setLanguage(SUPPORTED_LANGUAGES[0].code);
    fixture.detectChanges();
  });

  it('should create the language selector component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the initial active language code and flag matching configuration SSOT', () => {
    const defaultOption = SUPPORTED_LANGUAGES[0];
    const codeEl = fixture.nativeElement.querySelector('.current-code');
    const flagEl = fixture.nativeElement.querySelector('.current-flag');

    expect(codeEl.textContent.trim()).toBe(defaultOption.code.toUpperCase());
    expect(flagEl.textContent.trim()).toBe(defaultOption.flag);
  });

  it('should reactively update trigger flag and code when language changes', () => {
    SUPPORTED_LANGUAGES.forEach(({ code, flag }) => {
      component.setLanguage(code);
      fixture.detectChanges();

      const codeEl = fixture.nativeElement.querySelector('.current-code');
      const flagEl = fixture.nativeElement.querySelector('.current-flag');

      expect(codeEl.textContent.trim()).toBe(code.toUpperCase());
      expect(flagEl.textContent.trim()).toBe(flag);
    });
  });

  it('should provide language options catalog matching project configuration SSOT', () => {
    expect(component.languages).toEqual(SUPPORTED_LANGUAGES);
  });

  it('should always place the currently active language first in sortedLanguages', () => {
    SUPPORTED_LANGUAGES.forEach(({ code }) => {
      component.setLanguage(code);
      fixture.detectChanges();

      const sorted = component.sortedLanguages();
      expect(sorted[0].code).toBe(code);
      expect(sorted.length).toBe(SUPPORTED_LANGUAGES.length);
    });
  });
});
