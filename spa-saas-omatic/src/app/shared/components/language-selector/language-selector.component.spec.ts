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

  it('should display the initial active language code and semantic icon', () => {
    const defaultOption = SUPPORTED_LANGUAGES[0];
    const codeEl = fixture.nativeElement.querySelector('.current-code');
    const iconEl = fixture.nativeElement.querySelector('.lang-icon');

    expect(codeEl.textContent.trim()).toBe(defaultOption.code.toUpperCase());
    expect(iconEl.textContent.trim()).toBe('translate');
  });

  it('should reactively update trigger code when language changes', () => {
    SUPPORTED_LANGUAGES.forEach(({ code }) => {
      component.setLanguage(code);
      fixture.detectChanges();

      const codeEl = fixture.nativeElement.querySelector('.current-code');
      expect(codeEl.textContent.trim()).toBe(code.toUpperCase());
    });
  });

  it('should provide language options catalog matching project configuration SSOT in stable order', () => {
    expect(component.languages).toEqual(SUPPORTED_LANGUAGES);
  });

  it('should delegate setLanguage call to I18nService directly', () => {
    const serviceSpy = vi.spyOn(i18nService, 'setLanguage');
    component.setLanguage('de');
    expect(serviceSpy).toHaveBeenCalledWith('de');
  });
});
