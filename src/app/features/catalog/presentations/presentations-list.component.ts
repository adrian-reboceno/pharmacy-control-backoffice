import {
  Component, inject, signal, OnInit,
  AfterViewInit, TemplateRef, viewChild
} from '@angular/core';
import { SlicePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { PresentationsService, PresentationDTO } from './presentations.service';
import { AlertService } from '../../../shared/services/alert.service';
import { PresentationFormDialogComponent } from './presentation-form-dialog.component';
import {
  DataTableComponent, DataTableColumn, DataTablePageEvent
} from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-presentations-list',
  standalone: true,
  imports: [SlicePipe, MatIconModule, MatTooltipModule, DataTableComponent],
  templateUrl: './presentations-list.component.html',
  styleUrl: './presentations-list.component.scss',
})
export class PresentationsListComponent implements OnInit, AfterViewInit {
  private service = inject(PresentationsService);
  private alert   = inject(AlertService);
  private dialog  = inject(MatDialog);

  items   = signal<PresentationDTO[]>([]);
  total   = signal(0);
  loading = signal(false);
  filterActive = signal<boolean | undefined>(undefined);

  private currentPage   = 1;
  private currentSize   = 10;
  private currentSearch = '';

  abbrevTpl = viewChild.required<TemplateRef<any>>('abbrevTpl');
  descTpl   = viewChild.required<TemplateRef<any>>('descTpl');
  statusTpl = viewChild.required<TemplateRef<any>>('statusTpl');

  columns: DataTableColumn[] = [];

  ngOnInit() { this.loadData(); }

  ngAfterViewInit() {
    this.columns = [
      { key: 'name',         label: 'Nombre',      sortable: true },
      { key: 'abbreviation', label: 'Abreviatura',  template: this.abbrevTpl(), sortable: true },
      { key: 'description',  label: 'Descripción',  template: this.descTpl(),   sortable: false },
      { key: 'is_active',    label: 'Estado',        template: this.statusTpl(), sortable: false },
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
        this.alert.error('No se pudieron cargar las presentaciones.');
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
    const ref = this.dialog.open(PresentationFormDialogComponent, {
      data: { presentation: null },
      width: '460px', maxWidth: '90vw', autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      this.alert.toast('Presentación creada correctamente.', 'success');
      this.loadData();
    }
  }

  async openEdit(presentation: PresentationDTO) {
    const ref = this.dialog.open(PresentationFormDialogComponent, {
      data: { presentation },
      width: '460px', maxWidth: '90vw', autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      this.alert.toast('Presentación actualizada correctamente.', 'success');
      this.loadData();
    }
  }

  async deactivate(presentation: PresentationDTO) {
    const confirmed = await this.alert.confirmDelete(presentation.name);
    if (!confirmed) return;
    this.service.deactivate(presentation.id).subscribe({
      next:  () => { this.alert.toast('Presentación desactivada.', 'success'); this.loadData(); },
      error: () => { this.alert.error('No se pudo desactivar la presentación.'); }
    });
  }
}
