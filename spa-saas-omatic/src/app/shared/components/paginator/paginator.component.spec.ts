import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginatorComponent } from './paginator.component';

describe('PaginatorComponent', () => {
  let component: PaginatorComponent;
  let fixture: ComponentFixture<PaginatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginatorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('totalItems', 25);
    fixture.componentRef.setInput('pageSizeOptions', [5, 10, 20]);
    fixture.detectChanges();
  });

  it('should create the paginator component and calculate totalPages', () => {
    expect(component).toBeTruthy();
    expect(component.totalPages()).toBe(5);
    expect(component.displayedRange()).toEqual({ start: 1, end: 5, total: 25 });
  });

  it('should navigate to page 2', () => {
    component.goToPage(2);
    expect(component.currentPage()).toBe(2);
    expect(component.displayedRange()).toEqual({ start: 6, end: 10, total: 25 });
  });

  it('should handle page size changes and reset to page 1', () => {
    component.goToPage(3);
    expect(component.currentPage()).toBe(3);

    component.onPageSizeChange(10);
    expect(component.pageSize()).toBe(10);
    expect(component.currentPage()).toBe(1);
    expect(component.totalPages()).toBe(3);
  });

  it('should return 0 range when totalItems is 0', () => {
    fixture.componentRef.setInput('totalItems', 0);
    expect(component.displayedRange()).toEqual({ start: 0, end: 0, total: 0 });
  });

  it('should not navigate out of bounds on goToPage', () => {
    component.goToPage(-1);
    expect(component.currentPage()).toBe(1);

    component.goToPage(999);
    expect(component.currentPage()).toBe(1);

    component.goToPage(1);
    expect(component.currentPage()).toBe(1);
  });

  it('should navigate via template buttons (next, prev, first, last, number buttons)', () => {
    fixture.componentRef.setInput('totalItems', 25);
    component.currentPage.set(2);
    fixture.detectChanges();

    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.pagination-controls button')
    );
    expect(buttons.length).toBeGreaterThan(0);

    // Click next
    const nextBtn = buttons.find((b) => b.getAttribute('aria-label')?.includes('siguiente') || b.querySelector('mat-icon')?.textContent?.trim() === 'chevron_right');
    nextBtn?.click();
    fixture.detectChanges();
    expect(component.currentPage()).toBe(3);

    // Click prev
    const prevBtn = buttons.find((b) => b.getAttribute('aria-label')?.includes('anterior') || b.querySelector('mat-icon')?.textContent?.trim() === 'chevron_left');
    prevBtn?.click();
    fixture.detectChanges();
    expect(component.currentPage()).toBe(2);

    // Click first
    const firstBtn = buttons.find((b) => b.getAttribute('aria-label')?.includes('primera') || b.querySelector('mat-icon')?.textContent?.trim() === 'first_page');
    firstBtn?.click();
    fixture.detectChanges();
    expect(component.currentPage()).toBe(1);

    // Click last
    const lastBtn = buttons.find((b) => b.getAttribute('aria-label')?.includes('última') || b.querySelector('mat-icon')?.textContent?.trim() === 'last_page');
    lastBtn?.click();
    fixture.detectChanges();
    expect(component.currentPage()).toBe(5);

    // Click number button 3
    const numBtn = buttons.find((b) => b.textContent?.trim() === '3');
    numBtn?.click();
    fixture.detectChanges();
    expect(component.currentPage()).toBe(3);
  });
});
