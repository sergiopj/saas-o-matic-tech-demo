import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Customer, CustomerCreate } from '../models/customer.model';
import { ProblemDetail } from '../../../core/errors/problem-detail.model';
import { I18nService } from '../../../core/services/i18n.service';

/**
 * Service orchestrating HTTP communication with the /customers backend API.
 * Encapsulates server-side searching, error normalization (RFC 7807), and reactive loading signals.
 */
@Injectable({
  providedIn: 'root',
})
export class CustomerApiService {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18nService);
  private readonly baseUrl = `${environment.apiBaseUrl}/customers`;

  readonly loading = signal<boolean>(false);
  readonly error = signal<ProblemDetail | null>(null);

  private normalizeProblem(err: unknown): ProblemDetail {
    if (err && typeof err === 'object' && 'title' in err && 'status' in err && 'detail' in err) {
      return err as ProblemDetail;
    }
    return {
      type: 'about:blank',
      title: this.i18n.t('error.communication.title'),
      status: (err as { status?: number })?.status || 500,
      detail: this.i18n.t('error.communication.detail'),
      instance: this.baseUrl,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Queries customers using server-side filtering by partial company name / tax ID / email
   * and strict ISO country jurisdiction.
   */
  search(term?: string, country?: string): Observable<Customer[]> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams();
    if (term && term.trim()) {
      params = params.set('search', term.trim());
    }
    if (country && country.trim() && country.trim().toUpperCase() !== 'ALL') {
      params = params.set('country', country.trim().toUpperCase());
    }

    return this.http.get<Customer[]>(this.baseUrl, { params }).pipe(
      tap(() => this.error.set(null)),
      catchError((err: unknown) => {
        const problem = this.normalizeProblem(err);
        this.error.set(problem);
        return throwError(() => problem);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  getById(id: string): Observable<Customer> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.get<Customer>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.error.set(null)),
      catchError((err: unknown) => {
        const problem = this.normalizeProblem(err);
        this.error.set(problem);
        return throwError(() => problem);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  create(payload: CustomerCreate): Observable<Customer> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<Customer>(this.baseUrl, payload).pipe(
      tap(() => this.error.set(null)),
      catchError((err: unknown) => {
        const problem = this.normalizeProblem(err);
        this.error.set(problem);
        return throwError(() => problem);
      }),
      finalize(() => this.loading.set(false))
    );
  }
}
