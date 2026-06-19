import { Routes } from '@angular/router';
import { authGuard, permissionGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'catalog/categories',
        canActivate: [permissionGuard('catalog.categories.manage')],
        loadComponent: () =>
          import('./features/catalog/categories/categories-tree.component').then(m => m.CategoriesTreeComponent),
      },
      {
        path: 'catalog/classifications',
        canActivate: [permissionGuard('catalog.classifications.manage')],
        loadComponent: () =>
          import('./features/catalog/classifications/classifications-list.component').then(m => m.ClassificationsListComponent),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./shared/components/forbidden.component').then(m => m.ForbiddenComponent),
  },
  { path: '**', redirectTo: 'login' },
];
