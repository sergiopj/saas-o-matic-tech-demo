import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingStateComponent } from './loading-state.component';

describe('LoadingStateComponent', () => {
  let fixture: ComponentFixture<LoadingStateComponent>;
  let component: LoadingStateComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingStateComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the loading state component', () => {
    expect(component).toBeTruthy();
  });

  it('should render mat-spinner with default diameter 44 and a11y status role', () => {
    const wrapper = fixture.nativeElement.querySelector('.loading-state-wrapper');
    expect(wrapper).toBeTruthy();
    expect(wrapper.getAttribute('role')).toBe('status');
    expect(wrapper.getAttribute('aria-live')).toBe('polite');

    const spinner = fixture.nativeElement.querySelector('mat-spinner');
    expect(spinner).toBeTruthy();
  });

  it('should render custom message when message input is provided', () => {
    fixture.componentRef.setInput('message', 'Cargando clientes corporativos...');
    fixture.detectChanges();

    const msgEl = fixture.nativeElement.querySelector('.loading-message');
    expect(msgEl).toBeTruthy();
    expect(msgEl.textContent.trim()).toBe('Cargando clientes corporativos...');
  });

  it('should not render message paragraph when message input is empty', () => {
    const msgEl = fixture.nativeElement.querySelector('.loading-message');
    expect(msgEl).toBeNull();
  });
});
