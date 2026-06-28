import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ProductIngredientDTO {
  ingredient_id:   string;
  ingredient_name: string;
  concentration:   number;
  unit_id:         string;
  concentration_unit: string;
}

export interface ProductSpecsDTO {
  unit_id:           string;
  presentation_id:   string;
  route_id:          string;
  units_per_box:     number;
  units_per_blister: number;
  sanitary_reg:      string | null;
  barcode:           string | null;
  location_id:       string | null;
}

export interface ProductStockConfigDTO {
  min_stock:          number;
  max_stock:          number;
  expiry_alert_days:  number;
  manage_lots:        boolean;
  allow_fraction:     boolean;
}

export interface ProductMarginsDTO {
  retail_margin:    number;
  wholesale_margin: number;
}

export interface ProductImageDTO {
  id:         string;
  url:        string;
  is_primary: boolean;
  sort_order: number;
}


export interface ProductDTO {
  id:                   string;
  type:                 'GENERIC' | 'BRANDED';
  type_label:           string;
  name:                 string;
  description:          string | null;
  status_id:            string;
  category_id:          string;
  laboratory_id:        string | null;
  sale_condition:       'SIN_RECETA' | 'CON_RECETA' | 'CON_RECETA_RETENIDA';
  sale_condition_label: string;
  specs:                ProductSpecsDTO;
  stock_config:         ProductStockConfigDTO;
  margins:              ProductMarginsDTO;
  ingredients:          ProductIngredientDTO[];
  images: ProductImageDTO[];
  is_active:            boolean;
  created_by:           string | null;
  created_at:           string;
  updated_at:           string;
}

export interface ProductIngredientCommand {
  ingredient_id: string;
  concentration: string;
  concentration_unit: string;
}

export interface CreateProductCommand {
  type:               'GENERIC' | 'BRANDED';
  name:               string;
  description?:       string | null;
  status_id:          string;
  category_id:        string;
  laboratory_id?:     string | null;
  sale_condition:     'SIN_RECETA' | 'CON_RECETA' | 'CON_RECETA_RETENIDA';
  sanitary_reg?:      string | null;
  barcode?:           string | null;
  unit_id:            string;
  presentation_id:    string;
  route_id:           string;
  units_per_box:      number;
  units_per_blister:  number;
  location_id?:       string | null;
  min_stock:          number;
  max_stock:          number;
  expiry_alert_days:  number;
  manage_lots:        boolean;
  allow_fraction:     boolean;
  retail_margin:      number;
  wholesale_margin:   number;
  ingredients?:       ProductIngredientCommand[];
}

export type UpdateProductCommand = CreateProductCommand;

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; per_page: number; current_page: number; last_page: number; };
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/catalog/products`;

  getAll(filters?: {
    search?:        string;
    type?:          'GENERIC' | 'BRANDED';
    status_id?:     string;
    category_id?:   string;
    laboratory_id?: string;
    sale_condition?: string;
    manage_lots?:   boolean;
    is_active?:     boolean;
    per_page?:      number;
    page?:          number;
  }): Observable<PaginatedResponse<ProductDTO>> {
    let params = new HttpParams();
    if (filters?.search)                  params = params.set('search',        filters.search);
    if (filters?.type)                    params = params.set('type',          filters.type);
    if (filters?.status_id)               params = params.set('status_id',     filters.status_id);
    if (filters?.category_id)             params = params.set('category_id',   filters.category_id);
    if (filters?.laboratory_id)           params = params.set('laboratory_id', filters.laboratory_id);
    if (filters?.sale_condition)          params = params.set('sale_condition', filters.sale_condition);
    if (filters?.manage_lots !== undefined) params = params.set('manage_lots', String(filters.manage_lots));
    if (filters?.is_active !== undefined) params = params.set('is_active',     String(filters.is_active));
    if (filters?.per_page)                params = params.set('per_page',      filters.per_page);
    if (filters?.page)                    params = params.set('page',          filters.page);
    return this.http.get<PaginatedResponse<ProductDTO>>(this.base, { params });
  }

  getById(id: string): Observable<ProductDTO> {
    return this.http.get<ProductDTO>(`${this.base}/${id}`);
  }

  create(command: CreateProductCommand): Observable<ProductDTO> {
    return this.http.post<ProductDTO>(this.base, command);
  }

  update(id: string, command: UpdateProductCommand): Observable<ProductDTO> {
    return this.http.put<ProductDTO>(`${this.base}/${id}`, command);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  uploadImage(id: string, file: File): Observable<{data: ProductDTO}> {
    const fd = new FormData();
    fd.append('image', file);
    return this.http.post<{data: ProductDTO}>(`${this.base}/${id}/images`, fd);
  }

  deleteImage(productId: string, imageId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${productId}/images/${imageId}`);
  }

  reorderImages(productId: string, order: string[]): Observable<void> {
    return this.http.put<void>(`${this.base}/${productId}/images/reorder`, { order });
  }
}
