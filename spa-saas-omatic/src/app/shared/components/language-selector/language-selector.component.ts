import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { I18nService } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { SupportedLanguage } from '../../../core/i18n/translations';

@Component({
  selector: 'app-language-selector',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, TranslatePipe],
  templateUrl: './language-selector.component.html',
  styleUrl: './language-selector.component.scss',
})
export class LanguageSelectorComponent {
  private readonly i18n = inject(I18nService);

  readonly languages = this.i18n.languages;
  readonly currentLanguage = this.i18n.currentLanguage;
  readonly currentFlag = this.i18n.currentFlag;

  setLanguage(lang: SupportedLanguage): void {
    this.i18n.setLanguage(lang);
  }
}
