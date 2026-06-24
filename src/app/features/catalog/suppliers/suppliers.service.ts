import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AddressDTO {
  street:       string;
  ext_number:   string;
  int_number:   string | null;
  neighborhood: string;
  municipality: string;
  state:        string;
  postal_code:  string;
  country:      string;
  full_address: string;
}

export interface SupplierDTO {
  id:          string;
  type:        'MORAL' | 'FISICA';
  type_label:  string;
  rfc:         string | null;
  legal_name:  string;
  trade_name:  string | null;
  address:     AddressDTO;
  phone:       string | null;
  email:       string | null;
  is_active:   boolean;
  created_by:  string | null;
  created_at:  string;
  updated_at:  string;
}

export interface AddressCommand {
  street:       string;
  ext_number:   string;
  int_number?:  string | null;
  neighborhood: string;
  municipality: string;
  state:        string;
  postal_code:  string;
  country?:     string;
}

export interface CreateSupplierCommand {
  type:        'MORAL' | 'FISICA';
  rfc?:        string | null;
  legal_name:  string;
  trade_name?: string | null;
  address:     AddressCommand;
  phone?:      string | null;
  email?:      string | null;
}

export interface UpdateSupplierCommand {
  legal_name:  string;
  trade_name?: string | null;
  address:     AddressCommand;
  phone?:      string | null;
  email?:      string | null;
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
export class SuppliersService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/suppliers`;

  getAll(filters?: {
    search?:    string;
    type?:      'MORAL' | 'FISICA';
    is_active?: boolean;
    per_page?:  number;
    page?:      number;
  }): Observable<PaginatedResponse<SupplierDTO>> {
    let params = new HttpParams();
    if (filters?.search)                  params = params.set('search',    filters.search);
    if (filters?.type)                    params = params.set('type',      filters.type);
    if (filters?.is_active !== undefined) params = params.set('is_active', String(filters.is_active));
    if (filters?.per_page)                params = params.set('per_page',  filters.per_page);
    if (filters?.page)                    params = params.set('page',      filters.page);
    return this.http.get<PaginatedResponse<SupplierDTO>>(this.base, { params });
  }

  getById(id: string): Observable<SupplierDTO> {
    return this.http.get<SupplierDTO>(`${this.base}/${id}`);
  }

  create(command: CreateSupplierCommand): Observable<SupplierDTO> {
    return this.http.post<SupplierDTO>(this.base, command);
  }

  update(id: string, command: UpdateSupplierCommand): Observable<SupplierDTO> {
    return this.http.put<SupplierDTO>(`${this.base}/${id}`, command);
  }

  deactivate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
