import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Simulation, SimulationCreate } from '../models/simulation.model';
import { ProblemDetail } from '../../../core/errors/problem-detail.model';

@Injectable({
  providedIn: 'root',
})
export class SimulationApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/simulations`;

  readonly loading = signal<boolean>(false);
  readonly error = signal<ProblemDetail | null>(null);

  findByCustomer(customerId: string): Observable<Simulation[]> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams().set('customerId', customerId);

    return this.http.get<Simulation[]>(this.baseUrl, { params }).pipe(
      tap(() => this.error.set(null)),
      catchError((problem: ProblemDetail) => {
        this.error.set(problem);
        return throwError(() => problem);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  create(payload: SimulationCreate): Observable<Simulation> {
    this.loading.set(true);
    this.error.set(null);

    return this.http.post<Simulation>(this.baseUrl, payload).pipe(
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
