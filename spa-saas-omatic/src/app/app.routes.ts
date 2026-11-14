import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'customers',
    pathMatch: 'full',
  },
  {
    path: 'customers',
    loadComponent: () =>
      import('./modules/customers/pages/customer-list/customer-list.component').then(
        (m) => m.CustomerListComponent
      ),
  },
];
