import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { I18nService } from '../../../core/services/i18n.service';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;
  let component: SidebarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([]), I18nService],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the sidebar component', () => {
    expect(component).toBeTruthy();
  });

  it('should render all navigation items', () => {
    const navLinks = fixture.nativeElement.querySelectorAll('.nav-link');
    expect(navLinks.length).toBe(3);
  });

  it('should toggle collapse state on button click', () => {
    expect(component.isCollapsed()).toBe(false);
    component.toggleCollapse();
    expect(component.isCollapsed()).toBe(true);
    fixture.detectChanges();

    const container = fixture.nativeElement.querySelector('.sidebar-container');
    expect(container.classList.contains('is-collapsed')).toBe(true);
  });

  it('should render dynamic current year with external link to roams.es', () => {
    const linkEl = fixture.nativeElement.querySelector('.sidebar-footer .footer-link') as HTMLAnchorElement;
    expect(linkEl).toBeTruthy();
    expect(linkEl.getAttribute('href')).toBe('https://roams.es/');
    expect(linkEl.getAttribute('target')).toBe('_blank');
    expect(linkEl.getAttribute('rel')).toContain('noopener');
    expect(linkEl.textContent).toContain(`${new Date().getFullYear()}`);
    expect(linkEl.textContent).toContain('Roams');
  });

  it('should render the commercial optimizer brand tag when expanded and hide it when collapsed', () => {
    const brandTag = fixture.nativeElement.querySelector('.brand-tag');
    expect(brandTag).toBeTruthy();
    expect(brandTag.textContent.trim()).toBe('COMMERCIAL OPTIMIZER PANEL');

    component.toggleCollapse();
    fixture.detectChanges();
    const brandTagCollapsed = fixture.nativeElement.querySelector('.brand-tag');
    expect(brandTagCollapsed).toBeNull();
  });
});
