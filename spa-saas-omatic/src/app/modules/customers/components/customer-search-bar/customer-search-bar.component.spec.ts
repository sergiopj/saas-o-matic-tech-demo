import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CustomerSearchBarComponent } from './customer-search-bar.component';
import { I18nService } from '../../../../core/services/i18n.service';

describe('CustomerSearchBarComponent', () => {
  let fixture: ComponentFixture<CustomerSearchBarComponent>;
  let component: CustomerSearchBarComponent;
  let i18nService: I18nService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerSearchBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerSearchBarComponent);
    component = fixture.componentInstance;
    i18nService = TestBed.inject(I18nService);
    i18nService.setLanguage('es');
    fixture.detectChanges();
  });

  it('should create the search bar component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the search input with localized placeholder', () => {
    const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(inputEl).toBeTruthy();
    expect(inputEl.placeholder).toBe('Buscar por empresa, CIF/NIF o email...');
  });

  it('should emit search term after 300ms debounce', fakeAsync(() => {
    let emittedTerm = '';
    component.searchChange.subscribe((term) => {
      emittedTerm = term;
    });

    component.onInput('Roams Tech');
    expect(emittedTerm).toBe('');

    tick(299);
    expect(emittedTerm).toBe('');

    tick(1);
    expect(emittedTerm).toBe('Roams Tech');
  }));

  it('should not emit duplicate consecutive terms (distinctUntilChanged)', fakeAsync(() => {
    let emitCount = 0;
    component.searchChange.subscribe(() => {
      emitCount++;
    });

    component.onInput('Acme');
    tick(300);
    expect(emitCount).toBe(1);

    component.onInput('Acme');
    tick(300);
    expect(emitCount).toBe(1);
  }));

  it('should show clear button when query is present and reset on click', fakeAsync(() => {
    let emittedTerm = 'initial';
    component.searchChange.subscribe((term) => {
      emittedTerm = term;
    });

    component.onInput('Telefónica');
    tick(300);
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector('.clear-button');
    expect(clearBtn).toBeTruthy();

    clearBtn.click();
    tick(300);
    fixture.detectChanges();

    expect(component['query']()).toBe('');
    expect(emittedTerm).toBe('');
    expect(fixture.nativeElement.querySelector('.clear-button')).toBeNull();
  }));
});
