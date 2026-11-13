import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Customer, CustomerCreate } from '../models/customer.model';
import { ProblemDetail } from '../../../core/errors/problem-detail.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/customers`;

  readonly loading = signal<boolean>(false);
  readonly error = signal<ProblemDetail | null>(null);

  search(term?: string): Observable<Customer[]> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams();
    if (term && term.trim()) {
      params = params.set('search', term.trim());
    }

    return this.http.get<Customer[]>(this.baseUrl, { params }).pipe(
      tap(() => this.error.set(null)),
      catchError((problem: ProblemDetail) => {
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
      catchError((problem: ProblemDetail) => {
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
      catchError((problem: ProblemDetail) => {
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
