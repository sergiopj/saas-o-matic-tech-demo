import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SlideOverDrawerComponent } from './slide-over-drawer.component';
import { I18nService } from '../../../core/services/i18n.service';

describe('SlideOverDrawerComponent', () => {
  let component: SlideOverDrawerComponent;
  let fixture: ComponentFixture<SlideOverDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SlideOverDrawerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SlideOverDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the slide-over drawer component', () => {
    expect(component).toBeTruthy();
    expect(component.isOpen()).toBe(false);
  });

  it('should toggle open and closed states', () => {
    let closedEmitted = false;
    component.closed.subscribe(() => (closedEmitted = true));

    component.open();
    expect(component.isOpen()).toBe(true);

    component.close();
    expect(component.isOpen()).toBe(false);
    expect(closedEmitted).toBe(true);
  });

  it('should close on escape key when closeOnEscape is true', () => {
    component.open();
    expect(component.isOpen()).toBe(true);

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    component.onEscape(escapeEvent);

    expect(component.isOpen()).toBe(false);
  });

  it('should close when backdrop is clicked and closeOnBackdrop is true', () => {
    component.open();
    expect(component.isOpen()).toBe(true);

    component.onBackdropClick();
    expect(component.isOpen()).toBe(false);
  });

  it('should not re-open if already open, nor re-close if already closed', () => {
    let openCount = 0;
    let closeCount = 0;
    component.opened.subscribe(() => openCount++);
    component.closed.subscribe(() => closeCount++);

    component.open();
    expect(openCount).toBe(1);
    component.open(); // already open
    expect(openCount).toBe(1);

    component.close();
    expect(closeCount).toBe(1);
    component.close(); // already closed
    expect(closeCount).toBe(1);
  });

  it('should not close on escape key when closeOnEscape is false', () => {
    fixture.componentRef.setInput('closeOnEscape', false);
    component.open();
    expect(component.isOpen()).toBe(true);

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    component.onEscape(escapeEvent);
    expect(component.isOpen()).toBe(true);
  });

  it('should not close on backdrop click when closeOnBackdrop is false', () => {
    fixture.componentRef.setInput('closeOnBackdrop', false);
    component.open();
    expect(component.isOpen()).toBe(true);

    component.onBackdropClick();
    expect(component.isOpen()).toBe(true);
  });

  it('should render translated aria-label on close button and respect custom override', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.setLanguage('es');
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.close-btn');
    expect(closeBtn.getAttribute('aria-label')).toBe('Cerrar panel');

    i18n.setLanguage('en');
    fixture.detectChanges();
    expect(closeBtn.getAttribute('aria-label')).toBe('Close panel');

    fixture.componentRef.setInput('closeAriaLabel', 'Custom close label');
    fixture.detectChanges();
    expect(closeBtn.getAttribute('aria-label')).toBe('Custom close label');
  });
});
