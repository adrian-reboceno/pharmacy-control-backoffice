import {
  Component, inject, signal, OnInit,
  AfterViewInit, TemplateRef, viewChild
} from '@angular/core';
import { SlicePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ActiveIngredientsService, ActiveIngredientDTO } from './active-ingredients.service';
import { AlertService } from '../../../shared/services/alert.service';
import { ActiveIngredientFormDialogComponent } from './active-ingredient-form-dialog.component';
import {
  DataTableComponent, DataTableColumn, DataTablePageEvent
} from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-active-ingredients-list',
  standalone: true,
  imports: [SlicePipe, MatIconModule, MatTooltipModule, DataTableComponent],
  templateUrl: './active-ingredients-list.component.html',
  styleUrl: './active-ingredients-list.component.scss',
})
export class ActiveIngredientsListComponent implements OnInit, AfterViewInit {
  private service = inject(ActiveIngredientsService);
  private alert   = inject(AlertService);
  private dialog  = inject(MatDialog);

  items   = signal<ActiveIngredientDTO[]>([]);
  total   = signal(0);
  loading = signal(false);
  filterActive = signal<boolean | undefined>(undefined);

  private currentPage   = 1;
  private currentSize   = 10;
  private currentSearch = '';

  dciTpl    = viewChild.required<TemplateRef<any>>('dciTpl');
  casTpl    = viewChild.required<TemplateRef<any>>('casTpl');
  descTpl   = viewChild.required<TemplateRef<any>>('descTpl');
  statusTpl = viewChild.required<TemplateRef<any>>('statusTpl');

  columns: DataTableColumn[] = [];

  ngOnInit() { this.loadData(); }

  ngAfterViewInit() {
    this.columns = [
      { key: 'name',        label: 'Nombre',      sortable: true },
      { key: 'dci_code',    label: 'Código DCI',  template: this.dciTpl(),    sortable: true },
      { key: 'cas_number',  label: 'Núm. CAS',    template: this.casTpl(),    sortable: false },
      { key: 'description', label: 'Descripción', template: this.descTpl(),   sortable: false },
      { key: 'is_active',   label: 'Estado',      template: this.statusTpl(), sortable: false },
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
        this.alert.error('No se pudieron cargar los ingredientes activos.');
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
    const ref = this.dialog.open(ActiveIngredientFormDialogComponent, {
      data: { ingredient: null },
      width: '500px', maxWidth: '90vw', autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      this.alert.toast('Ingrediente activo creado correctamente.', 'success');
      this.loadData();
    }
  }

  async openEdit(ingredient: ActiveIngredientDTO) {
    const ref = this.dialog.open(ActiveIngredientFormDialogComponent, {
      data: { ingredient },
      width: '500px', maxWidth: '90vw', autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      this.alert.toast('Ingrediente activo actualizado correctamente.', 'success');
      this.loadData();
    }
  }

  async deactivate(ingredient: ActiveIngredientDTO) {
    const confirmed = await this.alert.confirmDelete(ingredient.name);
    if (!confirmed) return;
    this.service.deactivate(ingredient.id).subscribe({
      next:  () => { this.alert.toast('Ingrediente desactivado.', 'success'); this.loadData(); },
      error: () => { this.alert.error('No se pudo desactivar el ingrediente activo.'); }
    });
  }
}
