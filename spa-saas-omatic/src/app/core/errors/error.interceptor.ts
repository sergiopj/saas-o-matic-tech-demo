import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ProblemDetail } from './problem-detail.model';
import { I18nService } from '../services/i18n.service';

/**
 * Functional HTTP interceptor normalizing API and network errors for the UI.
 * Purely declarative: preserves backend ProblemDetails when present and falls back
 * to friendly localized copy without hardcoded status codes or range heuristics.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const i18n = inject(I18nService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const problem: ProblemDetail = {
        type: 'about:blank',
        instance: req.url,
        ...(typeof err.error === 'object' && err.error !== null ? err.error : {}),
        title: err.error?.title || i18n.t('error.communication.title'),
        detail: err.error?.detail || i18n.t('error.communication.detail'),
        status: err.status ? err.status : undefined,
      };

      return throwError(() => problem);
    })
  );
};
