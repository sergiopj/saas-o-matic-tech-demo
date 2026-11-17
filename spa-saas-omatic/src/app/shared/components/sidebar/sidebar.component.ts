import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface NavItem {
  path: string;
  labelKey: string;
  icon: string;
  badge?: string;
}

/**
 * Responsive lateral sidebar providing direct navigation to modules:
 * Home Overview (/home), Corporate Customers (/customers), and Simulations Studio (/simulations).
 */
@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TranslatePipe,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  readonly isCollapsed = signal<boolean>(false);
  readonly currentYear = new Date().getFullYear();

  readonly navItems: readonly NavItem[] = [
    {
      path: '/home',
      labelKey: 'sidebar.home',
      icon: 'dashboard',
    },
    {
      path: '/customers',
      labelKey: 'sidebar.customers',
      icon: 'groups',
    },
    {
      path: '/simulations',
      labelKey: 'sidebar.simulations',
      icon: 'calculate',
    },
  ] as const;

  toggleCollapse(): void {
    this.isCollapsed.update((v) => !v);
  }
}
