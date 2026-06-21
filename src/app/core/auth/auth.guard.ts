import { inject }                         from '@angular/core';
import { CanActivateFn, Router }          from '@angular/router';
import { AuthService }                    from './auth.service';
import { InactivityService }              from './inactivity.service';
import { catchError, map, of, tap }       from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const auth       = inject(AuthService);
  const router     = inject(Router);
  const inactivity = inject(InactivityService);

  if (auth.isLoggedIn()) return true;

  return auth.tryRestoreSession().pipe(
    tap(() => inactivity.start()),
    map(() => true),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};

export const permissionGuard = (permission: string): CanActivateFn =>
  () => {
    const auth       = inject(AuthService);
    const router     = inject(Router);
    const inactivity = inject(InactivityService);

    if (auth.isLoggedIn()) {
      return auth.hasPermission(permission)
        ? true
        : router.createUrlTree(['/forbidden']);
    }

    return auth.tryRestoreSession().pipe(
      tap(() => inactivity.start()),
      map(() => {
        if (!auth.hasPermission(permission)) {
          return router.createUrlTree(['/forbidden']);
        }
        return true;
      }),
      catchError(() => of(router.createUrlTree(['/login'])))
    );
  };
