import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ProblemDetail } from './problem-detail.model';
import { I18nService } from '../services/i18n.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const i18n = inject(I18nService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const problem: ProblemDetail =
        err.error && typeof err.error === 'object' && 'title' in err.error && 'status' in err.error
          ? (err.error as ProblemDetail)
          : {
              type: 'about:blank',
              title: i18n.t('error.communication.title'),
              status: err.status || 500,
              detail: i18n.t('error.communication.detail'),
              instance: req.url || err.url || '/api',
              timestamp: new Date().toISOString(),
            };

      return throwError(() => problem);
    })
  );
};
