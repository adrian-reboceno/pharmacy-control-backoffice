import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface LaboratoryDTO {
  id:           string;
  name:         string;
  country_code: string;
  website:      string | null;
  is_active:    boolean;
  created_by:   string | null;
  created_at:   string;
  updated_at:   string;
}

export interface CreateLaboratoryCommand {
  name:         string;
  country_code: string;
  website?:     string | null;
}

export type UpdateLaboratoryCommand = CreateLaboratoryCommand;

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
export class LaboratoriesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/catalog/laboratories`;

  getAll(filters?: {
    search?:       string;
    country_code?: string;
    is_active?:    boolean;
    per_page?:     number;
    page?:         number;
  }): Observable<PaginatedResponse<LaboratoryDTO>> {
    let params = new HttpParams();
    if (filters?.search)                  params = params.set('search',       filters.search);
    if (filters?.country_code)            params = params.set('country_code', filters.country_code);
    if (filters?.is_active !== undefined) params = params.set('is_active',    String(filters.is_active));
    if (filters?.per_page)                params = params.set('per_page',     filters.per_page);
    if (filters?.page)                    params = params.set('page',         filters.page);
    return this.http.get<PaginatedResponse<LaboratoryDTO>>(this.base, { params });
  }

  getById(id: string): Observable<LaboratoryDTO> {
    return this.http.get<LaboratoryDTO>(`${this.base}/${id}`);
  }

  create(command: CreateLaboratoryCommand): Observable<LaboratoryDTO> {
    return this.http.post<LaboratoryDTO>(this.base, command);
  }

  update(id: string, command: UpdateLaboratoryCommand): Observable<LaboratoryDTO> {
    return this.http.put<LaboratoryDTO>(`${this.base}/${id}`, command);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
