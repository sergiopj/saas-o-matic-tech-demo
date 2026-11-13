import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CurrencySelectorComponent } from '../currency-selector/currency-selector.component';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    CurrencySelectorComponent,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  protected readonly i18n = inject(I18nService);

  readonly currentLanguage = this.i18n.currentLanguage;

  toggleLanguage(): void {
    const nextLang = this.currentLanguage() === 'es' ? 'en' : 'es';
    this.i18n.setLanguage(nextLang);
  }
}
