import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export const DEFAULT_TOAST_DURATION = 4000;
export const ERROR_TOAST_DURATION = 5000;

export interface ToastConfig {
  duration?: number;
  horizontalPosition?: 'start' | 'center' | 'end' | 'left' | 'right';
  verticalPosition?: 'top' | 'bottom';
  panelClass?: string | string[];
}

/**
 * Enterprise toast notification service encapsulating Angular Material MatSnackBar.
 * Enforces Single Source of Truth (SSOT) for feedback timing, positioning, and standardized actions.
 */
@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string, action = 'OK', config?: ToastConfig): void {
    this.snackBar.open(message, action, {
      duration: config?.duration ?? DEFAULT_TOAST_DURATION,
      horizontalPosition: config?.horizontalPosition ?? 'center',
      verticalPosition: config?.verticalPosition ?? 'bottom',
      panelClass: config?.panelClass,
    });
  }

  success(message: string, action = 'OK'): void {
    this.show(message, action, { duration: DEFAULT_TOAST_DURATION });
  }

  error(message: string, action = 'OK'): void {
    this.show(message, action, { duration: ERROR_TOAST_DURATION });
  }

  info(message: string, action = 'OK'): void {
    this.show(message, action);
  }
}
