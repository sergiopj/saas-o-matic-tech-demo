import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SlideOverDrawerComponent } from './slide-over-drawer.component';

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
});
