import { Routes } from '@angular/router';

export const SIMULATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/simulation-hub/simulation-hub.component').then(
        (m) => m.SimulationHubComponent
      ),
  },
];
