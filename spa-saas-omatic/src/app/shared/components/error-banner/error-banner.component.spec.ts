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

  const mockProblem: ProblemDetail = {
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

  it('should render problem status badge, title and detail when problem is provided', () => {
    componentRef.setInput('problem', mockProblem);
    fixture.detectChanges();

    const bannerEl = fixture.nativeElement.querySelector('.error-banner');
    expect(bannerEl).toBeTruthy();

    const statusBadge = fixture.nativeElement.querySelector('.error-status-badge');
    expect(statusBadge.textContent.trim()).toBe('400');

    const titleEl = fixture.nativeElement.querySelector('.error-title');
    expect(titleEl.textContent.trim()).toBe('Bad Request');

    const detailEl = fixture.nativeElement.querySelector('.error-detail');
    expect(detailEl.textContent.trim()).toBe('Customer with taxId already exists');
  });

  it('should render invalid parameters table when invalidParams are present', () => {
    componentRef.setInput('problem', mockProblem);
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
    const simpleProblem: ProblemDetail = {
      type: 'about:blank',
      title: 'Server Error',
      status: 500,
      detail: 'Internal failure',
      instance: '/api',
      timestamp: '2026-11-14T10:00:00.000Z',
    };

    componentRef.setInput('problem', simpleProblem);
    fixture.detectChanges();

    const invalidSection = fixture.nativeElement.querySelector('.invalid-params-section');
    expect(invalidSection).toBeNull();
  });

  it('should emit dismiss event when close button is clicked', () => {
    componentRef.setInput('problem', mockProblem);
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
    componentRef.setInput('problem', mockProblem);
    componentRef.setInput('dismissable', false);
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.dismiss-btn');
    expect(closeBtn).toBeNull();
  });

  it('should update table header labels when language changes', () => {
    componentRef.setInput('problem', mockProblem);
    fixture.detectChanges();

    let thList = fixture.nativeElement.querySelectorAll('.invalid-params-table th');
    expect(thList[0].textContent.trim()).toBe('Campo');
    expect(thList[1].textContent.trim()).toBe('Motivo');

    i18nService.setLanguage('en');
    fixture.detectChanges();

    thList = fixture.nativeElement.querySelectorAll('.invalid-params-table th');
    expect(thList[0].textContent.trim()).toBe('Field');
    expect(thList[1].textContent.trim()).toBe('Reason');
  });
});
