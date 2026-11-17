import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Customer, CustomerCreate, CustomerLite, CustomerSortBy, SortOrder } from '../models/customer.model';
import { ProblemDetail } from '../../../core/errors/problem-detail.model';
import { I18nService } from '../../../core/services/i18n.service';

export interface CustomerListResponse<T = Customer> {
  items: T[];
  total: number;
}

/**
 * Service orchestrating HTTP communication with the /customers backend API.
 * Encapsulates server-side searching, RFC 7807 error normalization,
 * and pure server-side pagination reading X-Total-Count headers.
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
   * Queries customers using server-side filtering by partial company name / tax ID / email,
   * strict ISO country jurisdiction, and server-side pagination with X-Total-Count header.
   */
  search<T = Customer>(
    term?: string,
    country?: string,
    page?: number,
    limit?: number,
    sortBy?: CustomerSortBy,
    order?: SortOrder,
    fields?: 'lite' | 'full',
  ): Observable<CustomerListResponse<T>> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams();
    if (term && term.trim()) {
      params = params.set('search', term.trim());
    }
    if (country && country.trim() && country.trim().toUpperCase() !== 'ALL') {
      params = params.set('country', country.trim().toUpperCase());
    }
    if (page && page > 0) {
      params = params.set('page', page.toString());
    }
    if (limit && limit > 0) {
      params = params.set('limit', limit.toString());
    }
    if (sortBy) {
      params = params.set('sortBy', sortBy);
    }
    if (order) {
      params = params.set('order', order);
    }
    if (fields) {
      params = params.set('fields', fields);
    }

    return this.http
      .get<T[]>(this.baseUrl, { params, observe: 'response' })
      .pipe(
        map((res: HttpResponse<T[]>) => {
          const items = res.body ?? [];
          const headerTotal = res.headers.get('x-total-count');
          const total = headerTotal ? parseInt(headerTotal, 10) : items.length;
          return { items, total };
        }),
        tap(() => this.error.set(null)),
        catchError((err: unknown) => {
          const problem = this.normalizeProblem(err);
          this.error.set(problem);
          return throwError(() => problem);
        }),
        finalize(() => this.loading.set(false))
      );
  }

  /**
   * Fetches lightweight read-model projections for executive dashboards.
   * Returns paginated meta with total and sparse CustomerLite items.
   */
  getRecentLite(limit = 4): Observable<CustomerListResponse<CustomerLite>> {
    return this.search<CustomerLite>(undefined, undefined, 1, limit, 'createdAt', 'DESC', 'lite');
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

  clearError(): void {
    this.error.set(null);
  }
}
