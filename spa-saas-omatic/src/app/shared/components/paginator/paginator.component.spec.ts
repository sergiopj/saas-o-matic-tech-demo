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
});
