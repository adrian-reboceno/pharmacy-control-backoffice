import { inject }                         from '@angular/core';
import { CanActivateFn, Router }          from '@angular/router';
import { AuthService }                    from './auth.service';
import { catchError, map, of }            from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  return auth.tryRestoreSession().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};

export const permissionGuard = (permission: string): CanActivateFn =>
  () => {
    const auth   = inject(AuthService);
    const router = inject(Router);

    if (auth.isLoggedIn()) {
      return auth.hasPermission(permission)
        ? true
        : router.createUrlTree(['/forbidden']);
    }

    return auth.tryRestoreSession().pipe(
      map(() => {
        if (!auth.hasPermission(permission)) {
          return router.createUrlTree(['/forbidden']);
        }
        return true;
      }),
      catchError(() => of(router.createUrlTree(['/login'])))
    );
  };
