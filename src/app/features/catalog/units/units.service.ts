import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface UnitDTO {
  id:         string;
  name:       string;
  symbol:     string;
  type:       'QUANTITY' | 'CONCENTRATION';
  type_label: string;
  is_active:  boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUnitCommand {
  name:   string;
  symbol: string;
  type:   'QUANTITY' | 'CONCENTRATION';
}

export type UpdateUnitCommand = CreateUnitCommand;

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
export class UnitsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/catalog/units`;

  getAll(filters?: {
    search?:    string;
    type?:      'QUANTITY' | 'CONCENTRATION';
    is_active?: boolean;
    per_page?:  number;
    page?:      number;
  }): Observable<PaginatedResponse<UnitDTO>> {
    let params = new HttpParams();
    if (filters?.search)    params = params.set('search',    filters.search);
    if (filters?.type)      params = params.set('type',      filters.type);
    if (filters?.is_active !== undefined) params = params.set('is_active', String(filters.is_active));
    if (filters?.per_page)  params = params.set('per_page',  filters.per_page);
    if (filters?.page)      params = params.set('page',      filters.page);
    return this.http.get<PaginatedResponse<UnitDTO>>(this.base, { params });
  }

  getById(id: string): Observable<UnitDTO> {
    return this.http.get<UnitDTO>(`${this.base}/${id}`);
  }

  create(command: CreateUnitCommand): Observable<UnitDTO> {
    return this.http.post<UnitDTO>(this.base, command);
  }

  update(id: string, command: UpdateUnitCommand): Observable<UnitDTO> {
    return this.http.put<UnitDTO>(`${this.base}/${id}`, command);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
