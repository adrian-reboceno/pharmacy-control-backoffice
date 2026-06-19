import {
  Component, inject, signal, OnInit,
  ViewChild, AfterViewInit, TemplateRef, viewChild
} from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ClassificationsService, ClassificationDTO } from './classifications.service';
import { AlertService } from '../../../shared/services/alert.service';
import { ClassificationFormDialogComponent } from './classification-form-dialog.component';
import { DataTableComponent, DataTableColumn, DataTablePageEvent } from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-classifications-list',
  standalone: true,
  imports: [LowerCasePipe, MatIconModule, MatTooltipModule, DataTableComponent],
  templateUrl: './classifications-list.component.html',
  styleUrl: './classifications-list.component.scss',
})
export class ClassificationsListComponent implements OnInit, AfterViewInit {
  private service = inject(ClassificationsService);
  private alert   = inject(AlertService);
  private dialog  = inject(MatDialog);

  items   = signal<ClassificationDTO[]>([]);
  total   = signal(0);
  loading = signal(false);
  filterControlled = signal<boolean | undefined>(undefined);
  filterActive     = signal<boolean | undefined>(undefined);

  private currentPage    = 1;
  private currentSize    = 10;
  private currentSearch  = '';
  private currentSortKey = '';
  private currentSortDir: 'asc' | 'desc' = 'asc';

  /* ── Template refs para las columnas ─────────── */
  groupTpl    = viewChild.required<TemplateRef<any>>('groupTpl');
  rxTpl       = viewChild.required<TemplateRef<any>>('rxTpl');
  validityTpl = viewChild.required<TemplateRef<any>>('validityTpl');
  controlTpl  = viewChild.required<TemplateRef<any>>('controlTpl');
  statusTpl   = viewChild.required<TemplateRef<any>>('statusTpl');

  columns: DataTableColumn[] = [];

  ngOnInit() { this.loadData(); }

  ngAfterViewInit() {
    this.columns = [
      { key: 'lgs_group',            label: 'Grupo LGS',      template: this.groupTpl(),    sortable: false },
      { key: 'name',                 label: 'Nombre',          sortable: true },
      { key: 'prescription_type',    label: 'Tipo de receta',  template: this.rxTpl(),       sortable: false },
      { key: 'validity_days',        label: 'Vigencia',        template: this.validityTpl(), sortable: false },
      { key: 'is_controlled',        label: 'Control',         template: this.controlTpl(),  sortable: false },
      { key: 'is_active',            label: 'Estado',          template: this.statusTpl(),   sortable: false },
    ];
  }

  loadData() {
    this.loading.set(true);
    this.service.getAll({
      is_controlled: this.filterControlled(),
      is_active:     this.filterActive(),
      per_page:      this.currentSize,
      page:          this.currentPage,
    }).subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.total.set(res.meta.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.alert.error('No se pudieron cargar las clasificaciones.');
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

  setControlled(value: boolean | undefined) {
    this.filterControlled.set(value);
    this.currentPage = 1;
    this.loadData();
  }

  setActive(value: boolean | undefined) {
    this.filterActive.set(value);
    this.currentPage = 1;
    this.loadData();
  }

  async openEdit(item: ClassificationDTO) {
    const ref = this.dialog.open(ClassificationFormDialogComponent, {
      data: item, width: '560px', maxWidth: '90vw', autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      this.alert.toast('Clasificación actualizada.', 'success');
      this.loadData();
    }
  }

  async deactivate(item: ClassificationDTO) {
    const confirmed = await this.alert.confirmDelete(item.name);
    if (!confirmed) return;
    this.service.deactivate(item.id).subscribe({
      next:  () => { this.alert.toast('Clasificación desactivada.', 'success'); this.loadData(); },
      error: () => { this.alert.error('No se pudo desactivar la clasificación.'); }
    });
  }
}
