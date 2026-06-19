import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ClassificationDTO {
  id:                   string;
  lgs_group:            'I' | 'II' | 'III' | 'IV_A' | 'IV_B' | 'V' | 'VI';
  lgs_group_label:      string;
  name:                 string;
  prescription_type:    'CON_CODIGO_BARRAS' | 'NORMAL' | 'SIN_RECETA';
  prescription_type_label: string;
  validity_days:        number | null;
  validity_note:        string | null;
  is_controlled:        boolean;
  is_active:            boolean;
  created_by:           string | null;
  created_at:           string;
  updated_at:           string;
}

export interface UpdateClassificationCommand {
  name:              string;
  prescription_type: 'CON_CODIGO_BARRAS' | 'NORMAL' | 'SIN_RECETA';
  validity_days?:    number | null;
  validity_note?:    string | null;
}

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
export class ClassificationsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/catalog/classifications`;

  getAll(filters?: {
    is_active?:    boolean;
    is_controlled?: boolean;
    per_page?:     number;
    page?:         number;
  }): Observable<PaginatedResponse<ClassificationDTO>> {
    let params = new HttpParams();
    if (filters?.is_active    !== undefined) params = params.set('is_active',    String(filters.is_active));
    if (filters?.is_controlled !== undefined) params = params.set('is_controlled', String(filters.is_controlled));
    if (filters?.per_page) params = params.set('per_page', filters.per_page);
    if (filters?.page)     params = params.set('page',     filters.page);

    return this.http.get<PaginatedResponse<ClassificationDTO>>(this.base, { params });
  }

  getById(id: string): Observable<ClassificationDTO> {
    return this.http.get<ClassificationDTO>(`${this.base}/${id}`);
  }

  update(id: string, command: UpdateClassificationCommand): Observable<ClassificationDTO> {
    return this.http.put<ClassificationDTO>(`${this.base}/${id}`, command);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
