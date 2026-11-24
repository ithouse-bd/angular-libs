import { Routes } from '@angular/router';

/**
 * One route per library so every demo has its own shareable URL
 * (`/table`, `/dropdown`, `/cascader`).
 */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dropdown' },
  {
    path: 'dropdown',
    title: 'Dropdown · iTHouse Angular Libraries',
    loadComponent: () =>
      import('./pages/dropdown-demo.component').then((m) => m.DropdownDemoComponent),
  },
  {
    path: 'cascader',
    title: 'Cascading select · iTHouse Angular Libraries',
    loadComponent: () =>
      import('./pages/cascader-demo.component').then((m) => m.CascaderDemoComponent),
  },
  {
    path: 'table',
    title: 'Table · iTHouse Angular Libraries',
    loadComponent: () =>
      import('./pages/table-demo.component').then((m) => m.TableDemoComponent),
  },
  { path: '**', redirectTo: 'dropdown' },
];
