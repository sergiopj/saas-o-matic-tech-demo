import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ProblemDetail } from './problem-detail.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const problem: ProblemDetail =
        err.error && typeof err.error === 'object' && 'title' in err.error && 'status' in err.error
          ? (err.error as ProblemDetail)
          : {
              type: 'about:blank',
              title: 'Communication Error',
              status: err.status || 500,
              detail: 'An unexpected error occurred while communicating with the server.',
              instance: req.url || err.url || '/api',
              timestamp: new Date().toISOString(),
            };

      return throwError(() => problem);
    })
  );
};
