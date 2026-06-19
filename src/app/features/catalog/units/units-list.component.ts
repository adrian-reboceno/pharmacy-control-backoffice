import {
  Component, inject, signal, OnInit,
  AfterViewInit, TemplateRef, viewChild
} from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { UnitsService, UnitDTO } from './units.service';
import { AlertService } from '../../../shared/services/alert.service';
import { UnitFormDialogComponent } from './unit-form-dialog.component';
import {
  DataTableComponent, DataTableColumn, DataTablePageEvent
} from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-units-list',
  standalone: true,
  imports: [LowerCasePipe, MatIconModule, MatTooltipModule, DataTableComponent],
  templateUrl: './units-list.component.html',
  styleUrl: './units-list.component.scss',
})
export class UnitsListComponent implements OnInit, AfterViewInit {
  private service = inject(UnitsService);
  private alert   = inject(AlertService);
  private dialog  = inject(MatDialog);

  items   = signal<UnitDTO[]>([]);
  total   = signal(0);
  loading = signal(false);
  filterType   = signal<'QUANTITY' | 'CONCENTRATION' | undefined>(undefined);
  filterActive = signal<boolean | undefined>(undefined);

  private currentPage    = 1;
  private currentSize    = 10;
  private currentSearch  = '';
  private currentSortKey = '';
  private currentSortDir: 'asc' | 'desc' = 'asc';

  symbolTpl = viewChild.required<TemplateRef<any>>('symbolTpl');
  typeTpl   = viewChild.required<TemplateRef<any>>('typeTpl');
  statusTpl = viewChild.required<TemplateRef<any>>('statusTpl');

  columns: DataTableColumn[] = [];

  ngOnInit() { this.loadData(); }

  ngAfterViewInit() {
    this.columns = [
      { key: 'name',      label: 'Nombre',   sortable: true },
      { key: 'symbol',    label: 'Símbolo',  template: this.symbolTpl(), sortable: true },
      { key: 'type',      label: 'Tipo',     template: this.typeTpl(),   sortable: false },
      { key: 'is_active', label: 'Estado',   template: this.statusTpl(), sortable: false },
    ];
  }

  loadData() {
    this.loading.set(true);
    this.service.getAll({
      search:    this.currentSearch   || undefined,
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
        this.alert.error('No se pudieron cargar las unidades de medida.');
      }
    });
  }

  onPageChange(event: DataTablePageEvent) {
    this.currentPage    = event.page;
    this.currentSize    = event.pageSize;
    this.currentSearch  = event.search;
    this.currentSortKey = event.sortKey;
    this.currentSortDir = event.sortDir;
    this.loadData();
  }

  setType(value: 'QUANTITY' | 'CONCENTRATION' | undefined) {
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
    const ref = this.dialog.open(UnitFormDialogComponent, {
      data: { unit: null },
      width: '440px', maxWidth: '90vw', autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      this.alert.toast('Unidad creada correctamente.', 'success');
      this.loadData();
    }
  }

  async openEdit(unit: UnitDTO) {
    const ref = this.dialog.open(UnitFormDialogComponent, {
      data: { unit },
      width: '440px', maxWidth: '90vw', autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      this.alert.toast('Unidad actualizada correctamente.', 'success');
      this.loadData();
    }
  }

  async deactivate(unit: UnitDTO) {
    const confirmed = await this.alert.confirmDelete(unit.name);
    if (!confirmed) return;
    this.service.deactivate(unit.id).subscribe({
      next:  () => { this.alert.toast('Unidad desactivada.', 'success'); this.loadData(); },
      error: () => { this.alert.error('No se pudo desactivar la unidad.'); }
    });
  }
}
