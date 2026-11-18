import {
  Injectable,
  computed,
  signal,
  effect,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { getSafeStorageItem, setSafeStorageItem } from '../utils/storage.util';

export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'roams_theme';

/**
 * Enterprise reactive theme management service.
 * Governs the application-wide Light / Dark color scheme using Angular Signals,
 * localStorage persistence, OS prefers-color-scheme detection, and DOM attribute reflection.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly currentTheme = signal<ThemeMode>(this.getInitialTheme());
  readonly isDark = computed(() => this.currentTheme() === 'dark');

  constructor() {
    // Reactively synchronize the DOM attribute and classes on root and body elements
    effect(() => {
      const theme = this.currentTheme();
      this.applyThemeToDom(theme);
    });

    // Detect and respond to system color scheme changes if no explicit preference is stored
    if (this.isBrowser && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => {
        const stored = getSafeStorageItem(THEME_STORAGE_KEY);
        if (!stored) {
          this.setTheme(e.matches ? 'dark' : 'light', false);
        }
      };
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', listener);
      }
    }
  }

  toggleTheme(): void {
    const nextTheme: ThemeMode = this.isDark() ? 'light' : 'dark';
    this.setTheme(nextTheme, true);
  }

  setTheme(theme: ThemeMode, persist = true): void {
    this.currentTheme.set(theme);
    if (persist && this.isBrowser) {
      setSafeStorageItem(THEME_STORAGE_KEY, theme);
    }
  }

  private getInitialTheme(): ThemeMode {
    if (!this.isBrowser) {
      return 'light';
    }
    const stored = getSafeStorageItem(THEME_STORAGE_KEY) as ThemeMode | null;
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }

  private applyThemeToDom(theme: ThemeMode): void {
    if (!this.isBrowser || typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    root.dataset['theme'] = theme;
    if (theme === 'dark') {
      root.classList.add('dark-theme');
      if (document.body) {
        document.body.classList.add('dark-theme');
      }
    } else {
      root.classList.remove('dark-theme');
      if (document.body) {
        document.body.classList.remove('dark-theme');
      }
    }
  }
}
