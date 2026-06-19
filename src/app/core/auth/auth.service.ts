import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  userId:      string;
  email:       string;
  firstName:   string;
  lastName:    string;
  name:        string;
  permissions: string[];
  activeRole:  string | null;
}

interface TokenPair {
  token_type:    string;
  access_token:  string;
  refresh_token: string;
  expires_in:    number;
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

  private _user = signal<AuthUser | null>(this.loadFromSession());

  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn  = computed(() => this._user() !== null);
  readonly permissions = computed(() => this._user()?.permissions ?? []);

  login(email: string, password: string) {
    return this.http
      .post<ApiResponse<TokenPair>>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        map(r => r.data),
        tap(tokens => this.saveTokens(tokens)),
        switchMap(() => this.fetchMe())
      );
  }

  fetchMe() {
    return this.http
      .get<ApiResponse<MeResponse>>(`${environment.apiUrl}/auth/me`)
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
          sessionStorage.setItem('user', JSON.stringify(user));
        })
      );
  }

  logout() {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe();
    this.clearSession();
    this.router.navigate(['/login']);
  }

  refreshToken() {
    const refresh = sessionStorage.getItem('refresh_token');
    return this.http
      .post<ApiResponse<TokenPair>>(`${environment.apiUrl}/auth/refresh`, { refresh_token: refresh })
      .pipe(
        map(r => r.data),
        tap(tokens => this.saveTokens(tokens))
      );
  }

  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  getAccessToken(): string | null {
    return sessionStorage.getItem('access_token');
  }

  private saveTokens(tokens: TokenPair): void {
    sessionStorage.setItem('access_token',  tokens.access_token);
    sessionStorage.setItem('refresh_token', tokens.refresh_token);
  }

  private clearSession(): void {
    sessionStorage.clear();
    this._user.set(null);
  }

  private loadFromSession(): AuthUser | null {
    const token = sessionStorage.getItem('access_token');
    const user  = sessionStorage.getItem('user');
    if (!token) return null;
    try {
      const payload = this.decodePayload(token);
      if (payload.exp * 1000 < Date.now()) {
        sessionStorage.clear();
        return null;
      }
      if (user) return JSON.parse(user);
      return null;
    } catch { return null; }
  }

  private decodePayload(token: string): any {
    return JSON.parse(atob(token.split('.')[1]));
  }
}
