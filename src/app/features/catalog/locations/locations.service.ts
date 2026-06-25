import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface LocationDTO {
  id:          string;
  name:        string;
  level:       1 | 2 | 3 | 4;
  level_label: string;
  parent_id:   string | null;
  description: string | null;
  is_active:   boolean;
  is_leaf:     boolean;
  full_path:   string;
  created_by:  string | null;
  created_at:  string;
  updated_at:  string;
  children?:   LocationDTO[];
}

export interface CreateLocationCommand {
  name:         string;
  level:        1 | 2 | 3 | 4;
  parent_id?:   string | null;
  description?: string | null;
}

export interface UpdateLocationCommand {
  name:         string;
  description?: string | null;
}

interface ApiResponse<T> { data: T; }

@Injectable({ providedIn: 'root' })
export class LocationsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/catalog/locations`;

  getTree(isActive?: boolean): Observable<LocationDTO[]> {
    let params = new HttpParams();
    if (isActive !== undefined) params = params.set('is_active', String(isActive));
    return this.http
      .get<ApiResponse<LocationDTO[]>>(`${this.base}/tree`, { params })
      .pipe(map(r => r.data));
  }

  getAll(filters?: {
    level?:     number;
    parent_id?: string;
    is_active?: boolean;
  }): Observable<LocationDTO[]> {
    let params = new HttpParams();
    if (filters?.level     !== undefined) params = params.set('level',     filters.level);
    if (filters?.parent_id)               params = params.set('parent_id', filters.parent_id);
    if (filters?.is_active !== undefined) params = params.set('is_active', String(filters.is_active));
    return this.http
      .get<ApiResponse<LocationDTO[]>>(this.base, { params })
      .pipe(map(r => r.data));
  }

  getById(id: string): Observable<LocationDTO> {
    return this.http.get<LocationDTO>(`${this.base}/${id}`);
  }

  create(command: CreateLocationCommand): Observable<LocationDTO> {
    return this.http.post<LocationDTO>(this.base, command);
  }

  update(id: string, command: UpdateLocationCommand): Observable<LocationDTO> {
    return this.http.put<LocationDTO>(`${this.base}/${id}`, command);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
