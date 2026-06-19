import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn()
    ? true
    : inject(Router).createUrlTree(['/login']);
};

export const permissionGuard = (permission: string): CanActivateFn =>
  () => {
    const auth   = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLoggedIn())              return router.createUrlTree(['/login']);
    if (!auth.hasPermission(permission)) return router.createUrlTree(['/forbidden']);
    return true;
  };
