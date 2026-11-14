import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CustomerSearchBarComponent } from './customer-search-bar.component';
import { I18nService } from '../../../../core/services/i18n.service';

describe('CustomerSearchBarComponent', () => {
  let fixture: ComponentFixture<CustomerSearchBarComponent>;
  let component: CustomerSearchBarComponent;
  let i18nService: I18nService;

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [CustomerSearchBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerSearchBarComponent);
    component = fixture.componentInstance;
    i18nService = TestBed.inject(I18nService);
    i18nService.setLanguage('es');
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create the search bar component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the search input with localized placeholder matching SSOT', () => {
    const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(inputEl).toBeTruthy();
    expect(inputEl.placeholder).toBe('Buscar por empresa o CIF/NIF...');
  });

  it('should show spinner when debouncing user input', () => {
    component.onInput('Roams');
    fixture.detectChanges();

    expect(component.isDebouncing()).toBe(true);
    const spinner = fixture.nativeElement.querySelector('.search-spinner');
    expect(spinner).toBeTruthy();

    vi.advanceTimersByTime(300);
    fixture.detectChanges();

    expect(component.isDebouncing()).toBe(false);
  });

  it('should emit search term after 300ms debounce', () => {
    let emittedTerm = '';
    component.searchChange.subscribe((term) => {
      emittedTerm = term;
    });

    component.onInput('Roams Tech');
    expect(emittedTerm).toBe('');

    vi.advanceTimersByTime(299);
    expect(emittedTerm).toBe('');

    vi.advanceTimersByTime(1);
    expect(emittedTerm).toBe('Roams Tech');
  });

  it('should not emit duplicate consecutive terms (distinctUntilChanged)', () => {
    let emitCount = 0;
    component.searchChange.subscribe(() => {
      emitCount++;
    });

    component.onInput('Acme');
    vi.advanceTimersByTime(300);
    expect(emitCount).toBe(1);

    component.onInput('Acme');
    vi.advanceTimersByTime(300);
    expect(emitCount).toBe(1);
  });

  it('should show clear button when query is present and reset on click', () => {
    let emittedTerm = 'initial';
    component.searchChange.subscribe((term) => {
      emittedTerm = term;
    });

    component.onInput('Telefónica');
    vi.advanceTimersByTime(300);
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector('.clear-button');
    expect(clearBtn).toBeTruthy();

    clearBtn.click();
    vi.advanceTimersByTime(300);
    fixture.detectChanges();

    expect(component['query']()).toBe('');
    expect(emittedTerm).toBe('');
    expect(fixture.nativeElement.querySelector('.clear-button')).toBeNull();
  });
});
