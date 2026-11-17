import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../../core/services/theme.service';
import { I18nService } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

/**
 * Global transversal theme switch component.
 * Allows users to toggle reactively between Light and Dark mode anywhere in the app.
 * Follows W3C WCAG accessibility standards with role="switch" and screen-reader aria labels.
 * Includes a playful comic-style speech bubble hint that auto-dismisses after 5 seconds.
 */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule, TranslatePipe],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent implements OnInit, OnDestroy {
  private readonly themeService = inject(ThemeService);
  private readonly i18n = inject(I18nService);

  readonly isDark = this.themeService.isDark;
  readonly currentTheme = this.themeService.currentTheme;

  // Comic speech bubble state
  readonly showComicBubble = signal<boolean>(true);
  readonly isBubbleFading = signal<boolean>(false);
  private fadeTimer: ReturnType<typeof setTimeout> | null = null;
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  readonly tooltipText = computed(() => {
    return this.isDark()
      ? this.i18n.t('theme.toggle.light')
      : this.i18n.t('theme.toggle.dark');
  });

  readonly ariaLabel = computed(() => {
    return this.i18n.t('theme.toggle.aria');
  });

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      // Start graceful fade-out at 4.5s
      this.fadeTimer = setTimeout(() => {
        this.isBubbleFading.set(true);
      }, 4500);

      // Fully remove from DOM at 5.0s
      this.dismissTimer = setTimeout(() => {
        this.showComicBubble.set(false);
      }, 5000);
    }
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  dismissBubble(): void {
    this.clearTimers();
    this.showComicBubble.set(false);
  }

  private clearTimers(): void {
    if (this.fadeTimer) {
      clearTimeout(this.fadeTimer);
      this.fadeTimer = null;
    }
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
  }

  toggle(): void {
    this.dismissBubble();
    this.themeService.toggleTheme();
  }
}
