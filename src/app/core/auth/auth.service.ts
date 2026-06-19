import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient }                            from '@angular/common/http';
import { Router }                                from '@angular/router';
import { tap, map, switchMap }                   from 'rxjs/operators';
import { environment }                           from '../../../environments/environment';

export interface AuthUser {
  userId:      string;
  email:       string;
  firstName:   string;
  lastName:    string;
  name:        string;
  permissions: string[];
  activeRole:  string | null;
}

interface LoginResponse {
  expires_in:               number;
  requires_role_selection:  boolean;
  requires_password_change: boolean;
}

interface MeResponse {
  user_id:        string;
  email:          string;
  first_name:     string;
  last_name:      string;
  active_role_id: string | null;
  active_role:    string | null;
  permissions:    string[];
}

interface ApiResponse<T> { data: T; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  private _user          = signal<AuthUser | null>(null);
  private _sessionActive = signal<boolean>(false);

  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn  = computed(() => this._sessionActive());
  readonly permissions = computed(() => this._user()?.permissions ?? []);

  login(email: string, password: string) {
    return this.http
      .post<ApiResponse<LoginResponse>>(
        `${environment.apiUrl}/auth/login`,
        { email, password, client_type: 'WEB' },
        { withCredentials: true }
      )
      .pipe(
        map(r => r.data),
        tap(() => this._sessionActive.set(true)),
        switchMap(() => this.fetchMe())
      );
  }

  fetchMe() {
    return this.http
      .get<ApiResponse<MeResponse>>(
        `${environment.apiUrl}/auth/me`,
        { withCredentials: true }
      )
      .pipe(
        map(r => r.data),
        tap(me => {
          const user: AuthUser = {
            userId:      me.user_id,
            email:       me.email,
            firstName:   me.first_name,
            lastName:    me.last_name,
            name:        `${me.first_name} ${me.last_name}`.trim(),
            permissions: me.permissions,
            activeRole:  me.active_role,
          };
          this._user.set(user);
          this._sessionActive.set(true);
          sessionStorage.setItem('user', JSON.stringify(user));
        })
      );
  }

  logout(): void {
    this.http
      .post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .subscribe({ error: () => {} });
    this.clearState();
    this.router.navigate(['/login']);
  }

  refreshToken() {
    return this.http
      .post<ApiResponse<{ expires_in: number }>>(
        `${environment.apiUrl}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      .pipe(map(r => r.data));
  }

  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  tryRestoreSession() {
    return this.http
      .get<ApiResponse<MeResponse>>(
        `${environment.apiUrl}/auth/me`,
        { withCredentials: true }
      )
      .pipe(
        map(r => r.data),
        tap(me => {
          const user: AuthUser = {
            userId:      me.user_id,
            email:       me.email,
            firstName:   me.first_name,
            lastName:    me.last_name,
            name:        `${me.first_name} ${me.last_name}`.trim(),
            permissions: me.permissions,
            activeRole:  me.active_role,
          };
          this._user.set(user);
          this._sessionActive.set(true);
          sessionStorage.setItem('user', JSON.stringify(user));
        })
      );
  }

  loadCachedUser(): void {
    const cached = sessionStorage.getItem('user');
    if (cached) {
      try {
        const user = JSON.parse(cached) as AuthUser;
        this._user.set(user);
        this._sessionActive.set(true);
      } catch {
        sessionStorage.removeItem('user');
      }
    }
  }

  private clearState(): void {
    sessionStorage.removeItem('user');
    this._user.set(null);
    this._sessionActive.set(false);
  }
}
