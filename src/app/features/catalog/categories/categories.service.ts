import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CategoryDTO {
  id:          string;
  parent_id:   string | null;
  name:        string;
  slug:        string;
  description: string | null;
  is_active:   boolean;
  is_root:     boolean;
  created_by:  string | null;
  created_at:  string;
  updated_at:  string;
}

export interface CategoryTreeNode extends CategoryDTO {
  children: CategoryTreeNode[];
}

export interface CreateCategoryCommand {
  parent_id?:  string | null;
  name:        string;
  slug?:       string | null;
  description?: string | null;
}

export type UpdateCategoryCommand = CreateCategoryCommand;

interface ApiResponse<T> { data: T; }

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/catalog/categories`;

  /** Árbol completo de categorías, anidado recursivamente. */
  getTree(isActive?: boolean): Observable<CategoryTreeNode[]> {
    let params = new HttpParams();
    if (isActive !== undefined) params = params.set('is_active', String(isActive));

    return this.http
      .get<ApiResponse<CategoryTreeNode[]>>(`${this.base}/tree`, { params })
      .pipe(map(r => r.data));
  }

  getById(id: string): Observable<CategoryDTO> {
    return this.http
      .get<CategoryDTO>(`${this.base}/${id}`);
  }

  create(command: CreateCategoryCommand): Observable<CategoryDTO> {
    return this.http.post<CategoryDTO>(this.base, command);
  }

  update(id: string, command: UpdateCategoryCommand): Observable<CategoryDTO> {
    return this.http.put<CategoryDTO>(`${this.base}/${id}`, command);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
