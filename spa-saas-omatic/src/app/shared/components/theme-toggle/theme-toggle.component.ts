import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../../core/services/theme.service';
import { I18nService } from '../../../core/services/i18n.service';

/**
 * Global transversal theme switch component.
 * Allows users to toggle reactively between Light and Dark mode anywhere in the app.
 * Follows W3C WCAG accessibility standards with role="switch" and screen-reader aria labels.
 */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);
  private readonly i18n = inject(I18nService);

  readonly isDark = this.themeService.isDark;
  readonly currentTheme = this.themeService.currentTheme;

  readonly tooltipText = computed(() => {
    return this.isDark()
      ? this.i18n.t('theme.toggle.light')
      : this.i18n.t('theme.toggle.dark');
  });

  readonly ariaLabel = computed(() => {
    return this.i18n.t('theme.toggle.aria');
  });

  toggle(): void {
    this.themeService.toggleTheme();
  }
}
