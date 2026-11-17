import { TestBed } from '@angular/core/testing';
import { ThemeService, THEME_STORAGE_KEY } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark-theme');
    document.body.classList.remove('dark-theme');

    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.removeItem(THEME_STORAGE_KEY);
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark-theme');
    document.body.classList.remove('dark-theme');
  });

  it('should initialize with a valid theme mode', () => {
    expect(['light', 'dark']).toContain(service.currentTheme());
  });

  it('should toggle from light to dark and back to light', () => {
    service.setTheme('light');
    expect(service.currentTheme()).toBe('light');
    expect(service.isDark()).toBe(false);

    service.toggleTheme();
    expect(service.currentTheme()).toBe('dark');
    expect(service.isDark()).toBe(true);

    service.toggleTheme();
    expect(service.currentTheme()).toBe('light');
    expect(service.isDark()).toBe(false);
  });

  it('should reflect theme on document.documentElement attribute and classes', () => {
    service.setTheme('dark');
    TestBed.flushEffects();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
    expect(document.body.classList.contains('dark-theme')).toBe(true);

    service.setTheme('light');
    TestBed.flushEffects();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
    expect(document.body.classList.contains('dark-theme')).toBe(false);
  });

  it('should persist user theme preference to localStorage', () => {
    service.setTheme('dark', true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    service.setTheme('light', true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('should prioritize stored theme from localStorage on instantiation', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ThemeService],
    });
    const newService = TestBed.inject(ThemeService);

    expect(newService.currentTheme()).toBe('dark');
    expect(newService.isDark()).toBe(true);
  });
});
