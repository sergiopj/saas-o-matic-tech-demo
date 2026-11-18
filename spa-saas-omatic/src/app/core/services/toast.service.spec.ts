import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  ToastService,
  DEFAULT_TOAST_DURATION,
  ERROR_TOAST_DURATION,
} from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  let snackBarMock: { open: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    snackBarMock = { open: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        ToastService,
        { provide: MatSnackBar, useValue: snackBarMock },
      ],
    });

    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call snackBar.open with default config on show', () => {
    service.show('Test notification');

    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Test notification',
      'OK',
      expect.objectContaining({
        duration: DEFAULT_TOAST_DURATION,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      }),
    );
  });

  it('should call snackBar.open with 4000ms duration on success', () => {
    service.success('Operation succeeded');

    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Operation succeeded',
      'OK',
      expect.objectContaining({
        duration: DEFAULT_TOAST_DURATION,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      }),
    );
  });

  it('should call snackBar.open with 5000ms duration on error', () => {
    service.error('Operation failed');

    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Operation failed',
      'OK',
      expect.objectContaining({
        duration: ERROR_TOAST_DURATION,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      }),
    );
  });

  it('should call snackBar.open with default config on info', () => {
    service.info('Info note', 'ENTENDIDO');

    expect(snackBarMock.open).toHaveBeenCalledWith(
      'Info note',
      'ENTENDIDO',
      expect.objectContaining({
        duration: DEFAULT_TOAST_DURATION,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      }),
    );
  });
});
