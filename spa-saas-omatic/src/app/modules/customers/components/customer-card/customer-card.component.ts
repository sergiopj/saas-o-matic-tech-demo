import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Customer } from '../../models/customer.model';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { I18nService } from '../../../../core/services/i18n.service';
import { EmailComposerService } from '../../../../core/services/email-composer.service';

@Component({
  selector: 'app-customer-card',
  imports: [
    DatePipe,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe,
  ],
  templateUrl: './customer-card.component.html',
  styleUrl: './customer-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerCardComponent {
  private readonly emailComposer = inject(EmailComposerService);
  readonly i18n = inject(I18nService);

  readonly customer = input.required<Customer>();
  readonly selectCustomer = output<Customer>();

  readonly avatarInitial = computed(() =>
    this.customer().companyName.charAt(0).toUpperCase()
  );

  readonly planClass = computed(
    () => 'plan-' + this.customer().selectedPlan.toLowerCase()
  );

  onSimulate(): void {
    this.selectCustomer.emit(this.customer());
  }

  openEmailComposer(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.emailComposer.openForCustomer(this.customer());
  }
}
