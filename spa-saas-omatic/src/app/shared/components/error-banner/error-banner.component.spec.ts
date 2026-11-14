import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef } from '@angular/core';
import { ErrorBannerComponent } from './error-banner.component';
import { ProblemDetail } from '../../../core/errors/problem-detail.model';
import { I18nService } from '../../../core/services/i18n.service';

describe('ErrorBannerComponent', () => {
  let fixture: ComponentFixture<ErrorBannerComponent>;
  let component: ErrorBannerComponent;
  let componentRef: ComponentRef<ErrorBannerComponent>;
  let i18nService: I18nService;

  const mockClientProblem: ProblemDetail = {
    type: 'https://errors.saas-o-matic.com/400',
    title: 'Bad Request',
    status: 400,
    detail: 'Customer with taxId already exists',
    instance: '/customers',
    timestamp: '2026-11-14T10:00:00.000Z',
    invalidParams: [
      { name: 'taxId', reason: 'taxId must be unique' },
      { name: 'country', reason: 'country must be an ISO-3166 alpha-2 code' },
    ],
  };

  const mockServerProblem: ProblemDetail = {
    type: 'about:blank',
    title: 'Servicio temporalmente no disponible',
    status: 500,
    detail: 'No hemos podido conectar con el servidor.',
    instance: '/api/customers',
    timestamp: '2026-11-14T10:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorBannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorBannerComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    i18nService = TestBed.inject(I18nService);
    i18nService.setLanguage('es');
    fixture.detectChanges();
  });

  it('should not render anything when problem is null', () => {
    const bannerEl = fixture.nativeElement.querySelector('.error-banner');
    expect(bannerEl).toBeNull();
  });

  it('should render title, detail, and semantic icon when problem is provided', () => {
    componentRef.setInput('problem', mockClientProblem);
    fixture.detectChanges();

    const bannerEl = fixture.nativeElement.querySelector('.error-banner');
    expect(bannerEl).toBeTruthy();

    const titleEl = fixture.nativeElement.querySelector('.error-title');
    expect(titleEl.textContent.trim()).toBe('Bad Request');

    const detailEl = fixture.nativeElement.querySelector('.error-detail');
    expect(detailEl.textContent.trim()).toBe('Customer with taxId already exists');

    const icon = fixture.nativeElement.querySelector('.error-icon');
    expect(icon.textContent.trim()).toBe('error_outline');
  });

  it('should render retry button and emit retry event when retryable is true', () => {
    componentRef.setInput('problem', mockServerProblem);
    componentRef.setInput('retryable', true);
    fixture.detectChanges();

    let retryEmitted = false;
    component.retry.subscribe(() => {
      retryEmitted = true;
    });

    const retryBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.retry-btn');
    expect(retryBtn).toBeTruthy();
    expect(retryBtn.textContent.trim()).toContain('Reintentar');

    retryBtn.click();
    expect(retryEmitted).toBe(true);
  });

  it('should not render retry button by default (when retryable is false)', () => {
    componentRef.setInput('problem', mockServerProblem);
    fixture.detectChanges();

    const retryBtn = fixture.nativeElement.querySelector('.retry-btn');
    expect(retryBtn).toBeNull();
  });

  it('should render invalid parameters table when invalidParams are present', () => {
    componentRef.setInput('problem', mockClientProblem);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.invalid-params-table tbody tr');
    expect(rows.length).toBe(2);

    expect(rows[0].querySelector('.param-name').textContent.trim()).toBe('taxId');
    expect(rows[0].querySelector('.param-reason').textContent.trim()).toBe('taxId must be unique');

    expect(rows[1].querySelector('.param-name').textContent.trim()).toBe('country');
    expect(rows[1].querySelector('.param-reason').textContent.trim()).toBe(
      'country must be an ISO-3166 alpha-2 code'
    );
  });

  it('should not render invalid parameters section if invalidParams is omitted or empty', () => {
    componentRef.setInput('problem', mockServerProblem);
    fixture.detectChanges();

    const invalidSection = fixture.nativeElement.querySelector('.invalid-params-section');
    expect(invalidSection).toBeNull();
  });

  it('should emit dismiss event when close button is clicked', () => {
    componentRef.setInput('problem', mockClientProblem);
    fixture.detectChanges();

    let dismissed = false;
    component.dismiss.subscribe(() => {
      dismissed = true;
    });

    const closeBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.dismiss-btn');
    expect(closeBtn).toBeTruthy();
    closeBtn.click();

    expect(dismissed).toBe(true);
  });

  it('should not render close button when dismissable is false', () => {
    componentRef.setInput('problem', mockClientProblem);
    componentRef.setInput('dismissable', false);
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.dismiss-btn');
    expect(closeBtn).toBeNull();
  });

  it('should update table header labels and retry label when language changes', () => {
    componentRef.setInput('problem', mockClientProblem);
    componentRef.setInput('retryable', true);
    fixture.detectChanges();

    let thList = fixture.nativeElement.querySelectorAll('.invalid-params-table th');
    expect(thList[0].textContent.trim()).toBe('Campo');
    expect(thList[1].textContent.trim()).toBe('Motivo');

    let retryBtn = fixture.nativeElement.querySelector('.retry-btn');
    expect(retryBtn.textContent.trim()).toContain('Reintentar');

    i18nService.setLanguage('en');
    fixture.detectChanges();

    thList = fixture.nativeElement.querySelectorAll('.invalid-params-table th');
    expect(thList[0].textContent.trim()).toBe('Field');
    expect(thList[1].textContent.trim()).toBe('Reason');

    retryBtn = fixture.nativeElement.querySelector('.retry-btn');
    expect(retryBtn.textContent.trim()).toContain('Retry');
  });
});
