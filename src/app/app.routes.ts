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
      {
        path: 'catalog/units',
        canActivate: [permissionGuard('catalog.units.manage')],
        loadComponent: () =>
          import('./features/catalog/units/units-list.component').then(m => m.UnitsListComponent),
      },
      {
        path: 'catalog/presentations',
        canActivate: [permissionGuard('catalog.presentations.manage')],
        loadComponent: () =>
          import('./features/catalog/presentations/presentations-list.component').then(m => m.PresentationsListComponent),
      },
      {
        path: 'catalog/routes-of-administration',
        canActivate: [permissionGuard('catalog.routes-of-administration.manage')],
        loadComponent: () =>
          import('./features/catalog/routes-of-administration/routes-list.component').then(m => m.RoutesListComponent),
      },
      {
        path: 'catalog/status',
        canActivate: [permissionGuard('catalog.statuses.manage')],
        loadComponent: () =>
          import('./features/catalog/statuses/statuses-list.component').then(m => m.StatusesListComponent),
      },
      {
        path: 'catalog/laboratories',
        canActivate: [permissionGuard('catalog.laboratories.manage')],
        loadComponent: () =>
          import('./features/catalog/laboratories/laboratories-list.component').then(m => m.LaboratoriesListComponent),
      },
      {
        path: 'catalog/active-ingredients',
        canActivate: [permissionGuard('catalog.active-ingredients.manage')],
        loadComponent: () =>
          import('./features/catalog/active-ingredients/active-ingredients-list.component').then(m => m.ActiveIngredientsListComponent),
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
