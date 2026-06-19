import {
  Component, inject, signal, OnInit,
  AfterViewInit, TemplateRef, viewChild
} from '@angular/core';
import { SlicePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { RoutesService, RouteDTO } from './routes.service';
import { AlertService } from '../../../shared/services/alert.service';
import { RouteFormDialogComponent } from './route-form-dialog.component';
import {
  DataTableComponent, DataTableColumn, DataTablePageEvent
} from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-routes-list',
  standalone: true,
  imports: [SlicePipe, MatIconModule, MatTooltipModule, DataTableComponent],
  templateUrl: './routes-list.component.html',
  styleUrl: './routes-list.component.scss',
})
export class RoutesListComponent implements OnInit, AfterViewInit {
  private service = inject(RoutesService);
  private alert   = inject(AlertService);
  private dialog  = inject(MatDialog);

  items   = signal<RouteDTO[]>([]);
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
        this.alert.error('No se pudieron cargar las vías de administración.');
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
    const ref = this.dialog.open(RouteFormDialogComponent, {
      data: { route: null },
      width: '460px', maxWidth: '90vw', autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      this.alert.toast('Vía de administración creada correctamente.', 'success');
      this.loadData();
    }
  }

  async openEdit(route: RouteDTO) {
    const ref = this.dialog.open(RouteFormDialogComponent, {
      data: { route },
      width: '460px', maxWidth: '90vw', autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      this.alert.toast('Vía de administración actualizada correctamente.', 'success');
      this.loadData();
    }
  }

  async deactivate(route: RouteDTO) {
    const confirmed = await this.alert.confirmDelete(route.name);
    if (!confirmed) return;
    this.service.deactivate(route.id).subscribe({
      next:  () => { this.alert.toast('Vía desactivada.', 'success'); this.loadData(); },
      error: () => { this.alert.error('No se pudo desactivar la vía de administración.'); }
    });
  }
}
