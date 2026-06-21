import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface StatusDTO {
  id:          string;
  name:        string;
  code:        string;
  description: string | null;
  is_active:   boolean;
  created_by:  string | null;
  created_at:  string;
  updated_at:  string;
}

export interface CreateStatusCommand {
  name:         string;
  code:         string;
  description?: string | null;
}

export type UpdateStatusCommand = CreateStatusCommand;

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total:        number;
    per_page:     number;
    current_page: number;
    last_page:    number;
  };
}

@Injectable({ providedIn: 'root' })
export class StatusesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/catalog/statuses`;

  getAll(filters?: {
    search?:    string;
    is_active?: boolean;
    per_page?:  number;
    page?:      number;
  }): Observable<PaginatedResponse<StatusDTO>> {
    let params = new HttpParams();
    if (filters?.search)                  params = params.set('search',    filters.search);
    if (filters?.is_active !== undefined) params = params.set('is_active', String(filters.is_active));
    if (filters?.per_page)                params = params.set('per_page',  filters.per_page);
    if (filters?.page)                    params = params.set('page',      filters.page);
    return this.http.get<PaginatedResponse<StatusDTO>>(this.base, { params });
  }

  getById(id: string): Observable<StatusDTO> {
    return this.http.get<StatusDTO>(`${this.base}/${id}`);
  }

  create(command: CreateStatusCommand): Observable<StatusDTO> {
    return this.http.post<StatusDTO>(this.base, command);
  }

  update(id: string, command: UpdateStatusCommand): Observable<StatusDTO> {
    return this.http.put<StatusDTO>(`${this.base}/${id}`, command);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
