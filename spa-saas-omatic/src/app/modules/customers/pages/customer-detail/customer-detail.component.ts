import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CustomerApiService } from '../../services/customer-api.service';
import { SimulationApiService } from '../../../simulations/services/simulation-api.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { Customer } from '../../models/customer.model';
import { Simulation, SimulationProjection } from '../../../simulations/models/simulation.model';
import { projectSimulationCost } from '../../../simulations/utils/local-pricing-calculator';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { LocalizedCurrencyPipe } from '../../../../shared/pipes/localized-currency.pipe';
import { LoadingStateComponent } from '../../../../shared/components/loading-state/loading-state.component';
import { ErrorBannerComponent } from '../../../../shared/components/error-banner/error-banner.component';
import { EmailComposerDialogComponent } from '../../../../shared/components/email-composer-dialog/email-composer-dialog.component';
import { I18nService } from '../../../../core/services/i18n.service';

/**
 * Customer Detail view and Interactive Simulation Studio.
 * Allows corporate account inspection, real-time 60 FPS tiered pricing simulations
 * with live currency conversion, persistence to SQLite, and chronological simulation history.
 */
@Component({
  selector: 'app-customer-detail',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatSnackBarModule,
    TranslatePipe,
    LocalizedCurrencyPipe,
    LoadingStateComponent,
    ErrorBannerComponent,
  ],
  templateUrl: './customer-detail.component.html',
  styleUrl: './customer-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly i18n = inject(I18nService);
  readonly customerApi = inject(CustomerApiService);
  readonly simulationApi = inject(SimulationApiService);
  readonly currencyService = inject(CurrencyService);

  readonly customer = signal<Customer | null>(null);
  readonly customerLoading = signal<boolean>(true);
  readonly simulations = signal<Simulation[]>([]);
  readonly simulationsLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly saveSuccess = signal<boolean>(false);

  // Interactive Simulation Controls
  readonly activeUsers = signal<number>(15);
  readonly storageGb = signal<number>(50);
  readonly apiCalls = signal<number>(10000);

  // Live 60 FPS pricing projection
  readonly projection = computed<SimulationProjection>(() => {
    const cust = this.customer();
    const country = cust?.country ?? 'ES';
    const currency = this.currencyService.selectedCurrency();
    const rate = this.currencyService.currentRate();

    return projectSimulationCost(
      this.activeUsers(),
      this.storageGb(),
      this.apiCalls(),
      country,
      currency,
      rate
    );
  });

  // Tiers breakdown calculations
  readonly tier1Users = computed(() => Math.min(this.activeUsers(), 10));
  readonly tier1Cost = computed(() => this.tier1Users() * 10);

  readonly tier2Users = computed(() => Math.max(0, Math.min(this.activeUsers() - 10, 40)));
  readonly tier2Cost = computed(() => this.tier2Users() * 8);

  readonly tier3Users = computed(() => Math.max(0, this.activeUsers() - 50));
  readonly tier3Cost = computed(() => this.tier3Users() * 5);

  ngOnInit(): void {
    const customerId = this.route.snapshot.paramMap.get('id');
    if (customerId) {
      this.loadCustomerData(customerId);
    }
  }

  loadCustomerData(customerId: string): void {
    this.customerLoading.set(true);
    this.customerApi.getById(customerId).subscribe({
      next: (cust) => {
        this.customer.set(cust);
        this.customerLoading.set(false);
        this.loadSimulationsHistory(customerId);
      },
      error: () => {
        this.customerLoading.set(false);
      },
    });
  }

  private hasUserInteracted = false;

  loadSimulationsHistory(customerId: string): void {
    this.simulationsLoading.set(true);
    this.simulationApi.findByCustomer(customerId).subscribe({
      next: (items) => {
        // Sort descending by creation date
        const sorted = [...items].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.simulations.set(sorted);
        this.simulationsLoading.set(false);

        // Pre-populate interactive controls with customer's latest saved simulation if available
        // and user has not actively adjusted controls during this session
        if (sorted.length > 0 && !this.hasUserInteracted) {
          const latest = sorted[0];
          this.activeUsers.set(latest.activeUsers);
          this.storageGb.set(latest.storageGb);
          this.apiCalls.set(latest.apiCalls);
        }
      },
      error: () => {
        this.simulationsLoading.set(false);
      },
    });
  }

  onUsersSliderChange(event: Event): void {
    this.hasUserInteracted = true;
    const value = Number((event.target as HTMLInputElement).value);
    if (!isNaN(value) && value >= 0) {
      this.activeUsers.set(Math.floor(value));
      this.saveSuccess.set(false);
    }
  }

  onUsersInputChange(value: number): void {
    this.hasUserInteracted = true;
    const safe = Math.max(0, Math.floor(value || 0));
    this.activeUsers.set(safe);
    this.saveSuccess.set(false);
  }

  onStorageChange(value: number): void {
    this.hasUserInteracted = true;
    const safe = Math.max(0, Number(value) || 0);
    this.storageGb.set(safe);
    this.saveSuccess.set(false);
  }

  onApiCallsChange(value: number): void {
    this.hasUserInteracted = true;
    const safe = Math.max(0, Math.floor(Number(value) || 0));
    this.apiCalls.set(safe);
    this.saveSuccess.set(false);
  }

  loadSimulationIntoStudio(sim: Simulation): void {
    this.activeUsers.set(sim.activeUsers);
    this.storageGb.set(sim.storageGb);
    this.apiCalls.set(sim.apiCalls);
    this.saveSuccess.set(false);
    this.hasUserInteracted = true;

    this.snackBar.open(
      this.i18n.t('simulation.history.loadedNotification', {
        users: sim.activeUsers,
      }),
      'OK',
      { duration: 3000 }
    );
  }

  saveSimulation(): void {
    const cust = this.customer();
    if (!cust || this.isSaving()) return;

    this.isSaving.set(true);
    this.saveSuccess.set(false);

    this.simulationApi
      .create({
        customerId: cust.id,
        activeUsers: this.activeUsers(),
        storageGb: this.storageGb(),
        apiCalls: this.apiCalls(),
      })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.saveSuccess.set(true);
          // Allow newly saved simulation to become the persisted reference
          this.hasUserInteracted = false;
          this.loadSimulationsHistory(cust.id);
        },
        error: () => {
          this.isSaving.set(false);
        },
      });
  }

  openEmailComposer(): void {
    const cust = this.customer();
    if (!cust) return;

    const ref = this.dialog.open(EmailComposerDialogComponent, {
      data: {
        recipient: cust.email,
        recipientName: cust.companyName,
        subtitle: cust.country,
        subject: this.i18n.t('customers.emailDialog.defaultSubject', {
          company: cust.companyName,
        }),
        body: this.i18n.t('customers.emailDialog.defaultBody', {
          company: cust.companyName,
          plan: cust.selectedPlan,
        }),
      },
      width: '640px',
      maxWidth: '94vw',
      panelClass: 'roams-email-dialog-panel',
    });

    ref.afterClosed().subscribe((res) => {
      if (res?.sent) {
        this.snackBar.open(
          `Email enviado a ${res.recipient} (ID: ${res.messageId})`,
          'OK',
          { duration: 4500 }
        );
      }
    });
  }
}
