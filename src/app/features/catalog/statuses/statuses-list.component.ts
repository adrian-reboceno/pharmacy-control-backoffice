import {
  Component, inject, signal, OnInit,
  AfterViewInit, TemplateRef, viewChild
} from '@angular/core';
import { SlicePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { StatusesService, StatusDTO } from './statuses.service';
import { AlertService } from '../../../shared/services/alert.service';
import { StatusFormDialogComponent } from './status-form-dialog.component';
import {
  DataTableComponent, DataTableColumn, DataTablePageEvent
} from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-statuses-list',
  standalone: true,
  imports: [SlicePipe, MatIconModule, MatTooltipModule, DataTableComponent],
  templateUrl: './statuses-list.component.html',
  styleUrl: './statuses-list.component.scss',
})
export class StatusesListComponent implements OnInit, AfterViewInit {
  private service = inject(StatusesService);
  private alert   = inject(AlertService);
  private dialog  = inject(MatDialog);

  items   = signal<StatusDTO[]>([]);
  total   = signal(0);
  loading = signal(false);
  filterActive = signal<boolean | undefined>(undefined);

  private currentPage   = 1;
  private currentSize   = 10;
  private currentSearch = '';

  codeTpl   = viewChild.required<TemplateRef<any>>('codeTpl');
  descTpl   = viewChild.required<TemplateRef<any>>('descTpl');
  statusTpl = viewChild.required<TemplateRef<any>>('statusTpl');

  columns: DataTableColumn[] = [];

  ngOnInit() { this.loadData(); }

  ngAfterViewInit() {
    this.columns = [
      { key: 'name',        label: 'Nombre',      sortable: true },
      { key: 'code',        label: 'Código',       template: this.codeTpl(),   sortable: true },
      { key: 'description', label: 'Descripción',  template: this.descTpl(),   sortable: false },
      { key: 'is_active',   label: 'Estado',        template: this.statusTpl(), sortable: false },
    ];
  }

  loadData() {
    this.loading.set(true);
    this.service.getAll({
      search:    this.currentSearch || undefined,
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
        this.alert.error('No se pudieron cargar los estados de producto.');
      }
    });
  }

  onPageChange(event: DataTablePageEvent) {
    this.currentPage   = event.page;
    this.currentSize   = event.pageSize;
    this.currentSearch = event.search;
    this.loadData();
  }

  setActive(value: boolean | undefined) {
    this.filterActive.set(value);
    this.currentPage = 1;
    this.loadData();
  }

  async openCreate() {
    const ref = this.dialog.open(StatusFormDialogComponent, {
      data: { status: null },
      width: '460px', maxWidth: '90vw', autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      this.alert.toast('Estado creado correctamente.', 'success');
      this.loadData();
    }
  }

  async openEdit(status: StatusDTO) {
    const ref = this.dialog.open(StatusFormDialogComponent, {
      data: { status },
      width: '460px', maxWidth: '90vw', autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      this.alert.toast('Estado actualizado correctamente.', 'success');
      this.loadData();
    }
  }

  async deactivate(status: StatusDTO) {
    const confirmed = await this.alert.confirmDelete(status.name);
    if (!confirmed) return;
    this.service.deactivate(status.id).subscribe({
      next:  () => { this.alert.toast('Estado desactivado.', 'success'); this.loadData(); },
      error: () => { this.alert.error('No se pudo desactivar el estado.'); }
    });
  }
}
