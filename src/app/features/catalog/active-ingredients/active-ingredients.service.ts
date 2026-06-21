import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ActiveIngredientDTO {
  id:          string;
  name:        string;
  dci_code:    string;
  cas_number:  string | null;
  description: string | null;
  is_active:   boolean;
  created_by:  string | null;
  created_at:  string;
  updated_at:  string;
}

export interface CreateActiveIngredientCommand {
  name:         string;
  dci_code:     string;
  cas_number?:  string | null;
  description?: string | null;
}

export type UpdateActiveIngredientCommand = CreateActiveIngredientCommand;

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
export class ActiveIngredientsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/catalog/active-ingredients`;

  getAll(filters?: {
    search?:    string;
    is_active?: boolean;
    per_page?:  number;
    page?:      number;
  }): Observable<PaginatedResponse<ActiveIngredientDTO>> {
    let params = new HttpParams();
    if (filters?.search)                  params = params.set('search',    filters.search);
    if (filters?.is_active !== undefined) params = params.set('is_active', String(filters.is_active));
    if (filters?.per_page)                params = params.set('per_page',  filters.per_page);
    if (filters?.page)                    params = params.set('page',      filters.page);
    return this.http.get<PaginatedResponse<ActiveIngredientDTO>>(this.base, { params });
  }

  getById(id: string): Observable<ActiveIngredientDTO> {
    return this.http.get<ActiveIngredientDTO>(`${this.base}/${id}`);
  }

  create(command: CreateActiveIngredientCommand): Observable<ActiveIngredientDTO> {
    return this.http.post<ActiveIngredientDTO>(this.base, command);
  }

  update(id: string, command: UpdateActiveIngredientCommand): Observable<ActiveIngredientDTO> {
    return this.http.put<ActiveIngredientDTO>(`${this.base}/${id}`, command);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
