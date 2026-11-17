import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { NavbarComponent } from './navbar.component';
import { I18nService } from '../../../core/services/i18n.service';
import { environment } from '../../../../environments/environment';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        I18nService,
      ],
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);

    // Create component first; child CurrencySelectorComponent instantiates CurrencyService
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;

    // Handle initial rates fetch initiated by child CurrencySelectorComponent
    const req = httpTesting.expectOne(environment.currencyApiUrl);
    req.flush({ result: 'success', rates: { EUR: 1, USD: 1.08 } });

    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create the navbar component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the official Roams logo image and SaaS-O-Matic title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const logoImg = compiled.querySelector('.brand-logo-img') as HTMLImageElement;
    expect(logoImg).toBeTruthy();
    expect(logoImg.getAttribute('src')).toContain('images/roams-logo.png');
    expect(logoImg.getAttribute('alt')).toBe('Roams');
    expect(compiled.querySelector('.app-title')?.textContent).toContain('SaaS-O-Matic');
  });

  it('should render the embedded currency selector', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-currency-selector')).toBeTruthy();
  });

  it('should render the embedded language selector', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-language-selector')).toBeTruthy();
  });

  it('should render the embedded theme toggle switch in the navbar brand group', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-theme-toggle')).toBeTruthy();
  });

  it('should toggle mobile menu when hamburger button is clicked', () => {
    expect(component.isMobileMenuOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector('.mobile-nav-panel')).toBeNull();

    const menuBtn = fixture.nativeElement.querySelector('.mobile-menu-btn') as HTMLButtonElement;
    menuBtn.click();
    fixture.detectChanges();

    expect(component.isMobileMenuOpen()).toBe(true);
    expect(fixture.nativeElement.querySelector('.mobile-nav-panel')).toBeTruthy();

    const navLinks = fixture.nativeElement.querySelectorAll('.mobile-nav-link');
    expect(navLinks.length).toBe(3);

    menuBtn.click();
    fixture.detectChanges();

    expect(component.isMobileMenuOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector('.mobile-nav-panel')).toBeNull();
  });

  it('should close mobile menu on Escape key press only when open', () => {
    component.isMobileMenuOpen.set(false);
    component.onEscape();
    expect(component.isMobileMenuOpen()).toBe(false);

    component.toggleMobileMenu();
    fixture.detectChanges();
    expect(component.isMobileMenuOpen()).toBe(true);

    component.onEscape();
    fixture.detectChanges();
    expect(component.isMobileMenuOpen()).toBe(false);
  });

  it('should close mobile menu on backdrop click and NavigationEnd event', async () => {
    const router = TestBed.inject(Router);
    component.isMobileMenuOpen.set(true);
    fixture.detectChanges();
    expect(component.isMobileMenuOpen()).toBe(true);

    const backdrop = fixture.nativeElement.querySelector('.mobile-backdrop') as HTMLElement;
    expect(backdrop).toBeTruthy();
    backdrop.click();
    fixture.detectChanges();
    expect(component.isMobileMenuOpen()).toBe(false);

    component.isMobileMenuOpen.set(true);
    fixture.detectChanges();
    expect(component.isMobileMenuOpen()).toBe(true);

    await router.navigate([]);
    fixture.detectChanges();
    expect(component.isMobileMenuOpen()).toBe(false);
  });
});
