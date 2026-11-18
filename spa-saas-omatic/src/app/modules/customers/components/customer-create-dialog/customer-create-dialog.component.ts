import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { Subscription } from 'rxjs';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { CustomerApiService } from '../../services/customer-api.service';
import { I18nService } from '../../../../core/services/i18n.service';
import {
  Customer,
} from '../../models/customer.model';
import {
  fiscalTaxIdValidator,
  normalizeTaxId,
  rfc5322EmailValidator,
} from '../../../../core/validators/fiscal.validator';
import { ProblemDetail } from '../../../../core/errors/problem-detail.model';

export interface CountryOption {
  code: string;
  nameKey: string;
  flag: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'ES', nameKey: 'España', flag: '🇪🇸' },
  { code: 'DE', nameKey: 'Deutschland', flag: '🇩🇪' },
  { code: 'FR', nameKey: 'France', flag: '🇫🇷' },
  { code: 'GB', nameKey: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', nameKey: 'United States', flag: '🇺🇸' },
  { code: 'IT', nameKey: 'Italia', flag: '🇮🇹' },
  { code: 'CH', nameKey: 'Schweiz', flag: '🇨🇭' },
  { code: 'SE', nameKey: 'Sverige', flag: '🇸🇪' },
];

export const PLAN_OPTIONS: string[] = [
  'Growth Pro',
  'Starter SMB',
  'Scale Enterprise',
  'Enterprise Scale',
  'Enterprise Unlimited',
];

/**
 * Corporate dialog for registering a new customer company.
 * Features instant dirty error matching, real-time AEAT CIF/DNI/NIE checksum validation,
 * RFC 5322 email checking, and direct integration with POST /customers.
 */
@Component({
  selector: 'app-customer-create-dialog',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: './customer-create-dialog.component.html',
  styleUrl: './customer-create-dialog.component.scss',
})
export class CustomerCreateDialogComponent implements OnInit, OnDestroy {
  readonly dialogRef = inject(MatDialogRef<CustomerCreateDialogComponent>);
  readonly customerData = inject<Customer | null>(MAT_DIALOG_DATA, {
    optional: true,
  });
  private readonly customerApi = inject(CustomerApiService);
  private readonly i18n = inject(I18nService);

  readonly isEditMode = computed<boolean>(() => Boolean(this.customerData?.id));
  readonly matcher = new ShowOnDirtyErrorStateMatcher();
  readonly countries = COUNTRY_OPTIONS;
  readonly plans = PLAN_OPTIONS;

  readonly submitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly success = signal<boolean>(false);

  private countrySub?: Subscription;

  readonly countryControl = new FormControl<string>('ES', {
    nonNullable: true,
    validators: [(c) => Validators.required(c)],
  });

  readonly form = new FormGroup({
    companyName: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        (c) => Validators.required(c),
        Validators.minLength(2),
        Validators.maxLength(120),
      ],
    }),
    country: this.countryControl,
    taxId: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        (c) => Validators.required(c),
        fiscalTaxIdValidator((): string => this.countryControl.value ?? 'ES'),
      ],
    }),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [(c) => Validators.required(c), rfc5322EmailValidator()],
    }),
    selectedPlan: new FormControl<string>('Growth Pro', {
      nonNullable: true,
      validators: [(c) => Validators.required(c)],
    }),
  });

  ngOnInit(): void {
    if (this.customerData) {
      this.form.patchValue({
        companyName: this.customerData.companyName,
        country: this.customerData.country,
        taxId: this.customerData.taxId,
        email: this.customerData.email,
        selectedPlan: this.customerData.selectedPlan,
      });
    }

    this.countrySub = this.form.get('country')?.valueChanges.subscribe(() => {
      this.form.get('taxId')?.updateValueAndValidity();
    });
  }

  ngOnDestroy(): void {
    this.countrySub?.unsubscribe();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.form.get('companyName')?.markAsDirty();
      this.form.get('taxId')?.markAsDirty();
      this.form.get('email')?.markAsDirty();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();
    const payload = {
      companyName: raw.companyName.trim(),
      taxId: normalizeTaxId(raw.taxId),
      country: raw.country.trim().toUpperCase(),
      email: raw.email.trim().toLowerCase(),
      selectedPlan: raw.selectedPlan,
    };

    const request$ = this.customerData?.id
      ? this.customerApi.update(this.customerData.id, payload)
      : this.customerApi.create(payload);

    request$.subscribe({
      next: (customer: Customer) => {
        this.submitting.set(false);
        this.success.set(true);
        setTimeout(() => {
          this.dialogRef.close(customer);
        }, 600);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        const problem = err as ProblemDetail;
        const msg = problem?.detail || this.i18n.t('error.communication.detail');
        this.errorMessage.set(msg);
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
