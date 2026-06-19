import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject }                               from '@angular/core';
import { catchError, switchMap, throwError }    from 'rxjs';
import { AuthService }                          from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const apiReq = req.clone({ withCredentials: true });

  return next(apiReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/')) {
        return auth.refreshToken().pipe(
          switchMap(() => next(req.clone({ withCredentials: true }))),
          catchError(refreshError => {
            auth.logout();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
