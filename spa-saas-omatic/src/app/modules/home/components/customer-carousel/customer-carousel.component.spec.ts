import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CustomerCarouselComponent } from './customer-carousel.component';
import { CustomerLite } from '../../../customers/models/customer.model';
import { I18nService } from '../../../../core/services/i18n.service';

describe('CustomerCarouselComponent', () => {
  let fixture: ComponentFixture<CustomerCarouselComponent>;
  let component: CustomerCarouselComponent;

  const mockCustomers: CustomerLite[] = [
    { id: 'c1', companyName: 'Company 1', country: 'ES' },
    { id: 'c2', companyName: 'Company 2', country: 'DE' },
    { id: 'c3', companyName: 'Company 3', country: 'FR' },
    { id: 'c4', companyName: 'Company 4', country: 'IT' },
    { id: 'c5', companyName: 'Company 5', country: 'PT' },
    { id: 'c6', companyName: 'Company 6', country: 'US' },
    { id: 'c7', companyName: 'Company 7', country: 'GB' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerCarouselComponent],
      providers: [provideRouter([]), I18nService],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerCarouselComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('customers', mockCustomers);
    fixture.detectChanges();
  });

  it('should create the carousel component', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate maxSlideIndex based on total customers and visibleCardsCount', () => {
    component.visibleCardsCount.set(3);
    expect(component.maxSlideIndex()).toBe(4); // 7 - 3 = 4
    expect(component.currentSlideIndex()).toBe(0);
  });

  it('should navigate through slides in visible batches with slideNext and slidePrev', () => {
    component.visibleCardsCount.set(3);

    // Advances by batch of 3
    component.slideNext();
    expect(component.currentSlideIndex()).toBe(3);

    // Advances to maxSlideIndex (4)
    component.slideNext();
    expect(component.currentSlideIndex()).toBe(4);

    // Cannot advance past max
    component.slideNext();
    expect(component.currentSlideIndex()).toBe(4);

    // Retreats aligning with previous batch (4 - (4 % 3) = 3)
    component.slidePrev();
    expect(component.currentSlideIndex()).toBe(3);

    // Retreats full batch back to 0
    component.slidePrev();
    expect(component.currentSlideIndex()).toBe(0);

    // Cannot advance below 0
    component.slidePrev();
    expect(component.currentSlideIndex()).toBe(0);
  });

  it('should handle touch swipe navigation events', () => {
    fixture.componentRef.setInput('customers', mockCustomers.slice(0, 4));
    component.visibleCardsCount.set(2);

    // Swipe left (next): diff > 40 -> advances by batch of 2
    component.onTouchStart({ changedTouches: [{ clientX: 200 }] } as unknown as TouchEvent);
    component.onTouchEnd({ changedTouches: [{ clientX: 120 }] } as unknown as TouchEvent);
    expect(component.currentSlideIndex()).toBe(2);

    // Swipe right (prev): diff < -40 -> retreats by batch of 2
    component.onTouchStart({ changedTouches: [{ clientX: 100 }] } as unknown as TouchEvent);
    component.onTouchEnd({ changedTouches: [{ clientX: 180 }] } as unknown as TouchEvent);
    expect(component.currentSlideIndex()).toBe(0);
  });

  it('should handle desktop mouse drag navigation events', () => {
    fixture.componentRef.setInput('customers', mockCustomers.slice(0, 4));
    component.visibleCardsCount.set(2);

    // Drag left (diff > 40 -> next): advances by batch of 2
    component.onMouseDown({ button: 0, clientX: 200 } as MouseEvent);
    expect(component.isDragging()).toBe(true);
    component.onMouseUp({ clientX: 120 } as MouseEvent);
    expect(component.isDragging()).toBe(false);
    expect(component.currentSlideIndex()).toBe(2);

    // Drag right (diff < -40 -> prev): retreats by batch of 2
    component.onMouseDown({ button: 0, clientX: 100 } as MouseEvent);
    expect(component.isDragging()).toBe(true);
    component.onMouseUp({ clientX: 180 } as MouseEvent);
    expect(component.isDragging()).toBe(false);
    expect(component.currentSlideIndex()).toBe(0);

    // Mouse leave cancels drag
    component.onMouseDown({ button: 0, clientX: 100 } as MouseEvent);
    expect(component.isDragging()).toBe(true);
    component.onMouseLeave();
    expect(component.isDragging()).toBe(false);

    // Non-primary mouse click ignored
    component.onMouseDown({ button: 2, clientX: 100 } as MouseEvent);
    expect(component.isDragging()).toBe(false);
  });

  it('should render flanking arrow buttons when customers.length > 1', () => {
    fixture.componentRef.setInput('customers', mockCustomers.slice(0, 3));
    fixture.detectChanges();

    const prevBtn = fixture.nativeElement.querySelector('.carousel-arrow-btn.prev');
    const nextBtn = fixture.nativeElement.querySelector('.carousel-arrow-btn.next');

    expect(prevBtn).toBeTruthy();
    expect(nextBtn).toBeTruthy();
  });

  it('should adjust visibleCardsCount based on window resize breakpoints', () => {
    // Breakpoint < 640
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    window.dispatchEvent(new Event('resize'));
    expect(component.visibleCardsCount()).toBe(1);

    // Breakpoint < 1024
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 800 });
    window.dispatchEvent(new Event('resize'));
    expect(component.visibleCardsCount()).toBe(2);

    // Breakpoint >= 1024
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
    window.dispatchEvent(new Event('resize'));
    expect(component.visibleCardsCount()).toBe(3);
  });

  it('should clamp currentSlideIndex when it exceeds maxSlideIndex on resize', () => {
    component.currentSlideIndex.set(5);
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1200 });
    window.dispatchEvent(new Event('resize'));
    expect(component.currentSlideIndex()).toBe(component.maxSlideIndex());
  });
});
