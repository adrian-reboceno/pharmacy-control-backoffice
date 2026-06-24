import {
  Component, inject, signal, OnInit,
  AfterViewInit, TemplateRef, viewChild
} from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { SuppliersService, SupplierDTO } from './suppliers.service';
import { AlertService } from '../../../shared/services/alert.service';
import { SupplierFormDialogComponent } from './supplier-form-dialog.component';
import {
  DataTableComponent, DataTableColumn, DataTablePageEvent
} from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-suppliers-list',
  standalone: true,
  imports: [LowerCasePipe, MatIconModule, MatTooltipModule, DataTableComponent],
  templateUrl: './suppliers-list.component.html',
  styleUrl: './suppliers-list.component.scss',
})
export class SuppliersListComponent implements OnInit, AfterViewInit {
  private service = inject(SuppliersService);
  private alert   = inject(AlertService);
  private dialog  = inject(MatDialog);

  items   = signal<SupplierDTO[]>([]);
  total   = signal(0);
  loading = signal(false);
  filterType   = signal<'MORAL' | 'FISICA' | undefined>(undefined);
  filterActive = signal<boolean | undefined>(undefined);

  private currentPage   = 1;
  private currentSize   = 10;
  private currentSearch = '';

  tradeNameTpl = viewChild.required<TemplateRef<any>>('tradeNameTpl');
  rfcTpl       = viewChild.required<TemplateRef<any>>('rfcTpl');
  typeTpl      = viewChild.required<TemplateRef<any>>('typeTpl');
  statusTpl    = viewChild.required<TemplateRef<any>>('statusTpl');

  columns: DataTableColumn[] = [];

  ngOnInit() { this.loadData(); }

  ngAfterViewInit() {
    this.columns = [
      { key: 'legal_name',  label: 'Razón social',      sortable: true },
      { key: 'trade_name',  label: 'Nombre comercial',  template: this.tradeNameTpl(), sortable: false },
      { key: 'rfc',         label: 'RFC',                template: this.rfcTpl(),       sortable: false },
      { key: 'type',        label: 'Tipo',               template: this.typeTpl(),      sortable: false },
      { key: 'is_active',   label: 'Estado',             template: this.statusTpl(),    sortable: false },
    ];
  }

  loadData() {
    this.loading.set(true);
    this.service.getAll({
      search:    this.currentSearch || undefined,
      type:      this.filterType(),
      is_active: this.filterActive(),
      per_page:  this.currentSize,
      page:      this.currentPage,
    }).subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.total.set(res.meta.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.alert.error('No se pudieron cargar los proveedores.');
      }
    });
  }

  onPageChange(event: DataTablePageEvent) {
    this.currentPage   = event.page;
    this.currentSize   = event.pageSize;
    this.currentSearch = event.search;
    this.loadData();
  }

  setType(value: 'MORAL' | 'FISICA' | undefined) {
    this.filterType.set(value);
    this.currentPage = 1;
    this.loadData();
  }

  setActive(value: boolean | undefined) {
    this.filterActive.set(value);
    this.currentPage = 1;
    this.loadData();
  }

  async openCreate() {
    const ref = this.dialog.open(SupplierFormDialogComponent, {
      data: { supplier: null },
      width: '600px', maxWidth: '95vw', autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      this.alert.toast('Proveedor creado correctamente.', 'success');
      this.loadData();
    }
  }

  async openEdit(supplier: SupplierDTO) {
    const ref = this.dialog.open(SupplierFormDialogComponent, {
      data: { supplier },
      width: '600px', maxWidth: '95vw', autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      this.alert.toast('Proveedor actualizado correctamente.', 'success');
      this.loadData();
    }
  }

  async deactivate(supplier: SupplierDTO) {
    const confirmed = await this.alert.confirmDelete(supplier.legal_name);
    if (!confirmed) return;
    this.service.deactivate(supplier.id).subscribe({
      next:  () => { this.alert.toast('Proveedor desactivado.', 'success'); this.loadData(); },
      error: () => { this.alert.error('No se pudo desactivar el proveedor.'); }
    });
  }
}
