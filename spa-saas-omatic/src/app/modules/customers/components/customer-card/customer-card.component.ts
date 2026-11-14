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
    const codePoints = [...code].map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  }

  onSimulate(): void {
    this.selectCustomer.emit(this.customer());
  }
}
