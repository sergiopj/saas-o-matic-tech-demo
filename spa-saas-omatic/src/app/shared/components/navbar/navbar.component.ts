import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CurrencySelectorComponent } from '../currency-selector/currency-selector.component';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { APP_NAV_ITEMS } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    CurrencySelectorComponent,
    LanguageSelectorComponent,
    ThemeToggleComponent,
    TranslatePipe,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private readonly router = inject(Router);

  readonly isMobileMenuOpen = signal<boolean>(false);
  readonly navItems = APP_NAV_ITEMS;

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.closeMobileMenu();
      }
    });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.set(!this.isMobileMenuOpen());
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    if (this.isMobileMenuOpen()) {
      this.closeMobileMenu();
    }
  }
}
