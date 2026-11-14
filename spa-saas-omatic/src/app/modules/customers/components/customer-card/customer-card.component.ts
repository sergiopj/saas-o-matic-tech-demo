import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Customer } from '../../models/customer.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-customer-card',
  imports: [RouterLink, MatCardModule, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './customer-card.component.html',
  styleUrl: './customer-card.component.scss',
})
export class CustomerCardComponent {
  readonly customer = input.required<Customer>();
  readonly selectCustomer = output<Customer>();

  get countryFlag(): string {
    const code = this.customer().country?.toUpperCase();
    if (!code || code.length !== 2) return '🌐';

    // Unicode Standard: Regional Indicator Symbol 'A' is U+1F1E6
    // Offset converts standard ASCII 'A'-'Z' into Unicode flag indicator characters
    const REGIONAL_INDICATOR_A = 0x1f1e6;
    const ASCII_A = 'A'.charCodeAt(0);
    const codePoints = [...code].map((char) => char.charCodeAt(0) - ASCII_A + REGIONAL_INDICATOR_A);

    return String.fromCodePoint(...codePoints);
  }

  onSimulate(): void {
    this.selectCustomer.emit(this.customer());
  }
}
