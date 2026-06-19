import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PresentationDTO {
  id:           string;
  name:         string;
  abbreviation: string;
  description:  string | null;
  is_active:    boolean;
  created_by:   string | null;
  created_at:   string;
  updated_at:   string;
}

export interface CreatePresentationCommand {
  name:         string;
  abbreviation: string;
  description?: string | null;
}

export type UpdatePresentationCommand = CreatePresentationCommand;

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
export class PresentationsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/catalog/presentations`;

  getAll(filters?: {
    search?:    string;
    is_active?: boolean;
    per_page?:  number;
    page?:      number;
  }): Observable<PaginatedResponse<PresentationDTO>> {
    let params = new HttpParams();
    if (filters?.search)              params = params.set('search',    filters.search);
    if (filters?.is_active !== undefined) params = params.set('is_active', String(filters.is_active));
    if (filters?.per_page)            params = params.set('per_page',  filters.per_page);
    if (filters?.page)                params = params.set('page',      filters.page);
    return this.http.get<PaginatedResponse<PresentationDTO>>(this.base, { params });
  }

  getById(id: string): Observable<PresentationDTO> {
    return this.http.get<PresentationDTO>(`${this.base}/${id}`);
  }

  create(command: CreatePresentationCommand): Observable<PresentationDTO> {
    return this.http.post<PresentationDTO>(this.base, command);
  }

  update(id: string, command: UpdatePresentationCommand): Observable<PresentationDTO> {
    return this.http.put<PresentationDTO>(`${this.base}/${id}`, command);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
