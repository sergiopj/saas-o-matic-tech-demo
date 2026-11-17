import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ThemeToggleComponent } from './theme-toggle.component';
import { ThemeService, THEME_STORAGE_KEY } from '../../../core/services/theme.service';
import { I18nService } from '../../../core/services/i18n.service';

describe('ThemeToggleComponent', () => {
  let component: ThemeToggleComponent;
  let fixture: ComponentFixture<ThemeToggleComponent>;
  let themeService: ThemeService;

  beforeEach(async () => {
    vi.useFakeTimers();
    localStorage.removeItem(THEME_STORAGE_KEY);
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark-theme');
    document.body.classList.remove('dark-theme');

    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
      providers: [ThemeService, I18nService],
    }).compileComponents();

    themeService = TestBed.inject(ThemeService);
    themeService.setTheme('light');

    fixture = TestBed.createComponent(ThemeToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
    vi.useRealTimers();
    localStorage.removeItem(THEME_STORAGE_KEY);
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark-theme');
    document.body.classList.remove('dark-theme');
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
    expect(component.isDark()).toBe(false);
  });

  it('should render an accessible switch button with role="switch"', () => {
    const btn = fixture.nativeElement.querySelector('button.theme-switch-btn');
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('role')).toBe('switch');
    expect(btn.getAttribute('aria-checked')).toBe('false');
  });

  it('should toggle theme when clicked', () => {
    const btn = fixture.nativeElement.querySelector('button.theme-switch-btn');
    btn.click();
    fixture.detectChanges();

    expect(component.isDark()).toBe(true);
    expect(btn.getAttribute('aria-checked')).toBe('true');
    expect(btn.classList.contains('is-dark')).toBe(true);

    btn.click();
    fixture.detectChanges();

    expect(component.isDark()).toBe(false);
    expect(btn.getAttribute('aria-checked')).toBe('false');
    expect(btn.classList.contains('is-dark')).toBe(false);
  });

  it('should provide reactive localized tooltip and aria labels', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('es');
    expect(component.tooltipText()).toBe('Cambiar a modo oscuro');
    themeService.setTheme('dark');
    fixture.detectChanges();
    expect(component.tooltipText()).toBe('Cambiar a modo claro');
  });

  it('should render comic speech bubble on init and auto-dismiss after 5 seconds', () => {
    expect(component.showComicBubble()).toBe(true);
    let bubble = fixture.nativeElement.querySelector('.comic-speech-bubble');
    expect(bubble).toBeTruthy();
    expect(bubble.textContent).toContain('¡Prueba el modo oscuro o claro aquí! 🌓');

    // Advance 4500ms to trigger fading
    vi.advanceTimersByTime(4500);
    expect(component.isBubbleFading()).toBe(true);

    // Advance remaining 500ms to dismiss
    vi.advanceTimersByTime(500);
    fixture.detectChanges();
    expect(component.showComicBubble()).toBe(false);
    bubble = fixture.nativeElement.querySelector('.comic-speech-bubble');
    expect(bubble).toBeNull();
  });

  it('should dismiss comic speech bubble immediately when toggle() is called', () => {
    expect(component.showComicBubble()).toBe(true);
    const btn = fixture.nativeElement.querySelector('button.theme-switch-btn');
    btn.click();
    fixture.detectChanges();

    expect(component.showComicBubble()).toBe(false);
    const bubble = fixture.nativeElement.querySelector('.comic-speech-bubble');
    expect(bubble).toBeNull();
  });

  it('should dismiss comic speech bubble when close button is clicked', () => {
    expect(component.showComicBubble()).toBe(true);
    const closeBtn = fixture.nativeElement.querySelector('.bubble-close-btn');
    expect(closeBtn).toBeTruthy();
    closeBtn.click();
    fixture.detectChanges();

    expect(component.showComicBubble()).toBe(false);
  });
});
