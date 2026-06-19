import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  console.log('[authGuard] isLoggedIn:', auth.isLoggedIn());
  console.log('[authGuard] user:', auth.currentUser());
  return auth.isLoggedIn()
    ? true
    : inject(Router).createUrlTree(['/login']);
};

export const permissionGuard = (permission: string): CanActivateFn =>
  () => {
    const auth   = inject(AuthService);
    const router = inject(Router);
    console.log('[permissionGuard] permission:', permission);
    console.log('[permissionGuard] isLoggedIn:', auth.isLoggedIn());
    console.log('[permissionGuard] hasPermission:', auth.hasPermission(permission));
    console.log('[permissionGuard] permissions:', auth.permissions());
    if (!auth.isLoggedIn())              return router.createUrlTree(['/login']);
    if (!auth.hasPermission(permission)) return router.createUrlTree(['/forbidden']);
    return true;
  };
