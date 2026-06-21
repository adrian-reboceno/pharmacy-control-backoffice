import {
  Component, inject, signal, OnInit,
  AfterViewInit, TemplateRef, viewChild
} from '@angular/core';
import { SlicePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { LaboratoriesService, LaboratoryDTO } from './laboratories.service';
import { AlertService } from '../../../shared/services/alert.service';
import { LaboratoryFormDialogComponent } from './laboratory-form-dialog.component';
import {
  DataTableComponent, DataTableColumn, DataTablePageEvent
} from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-laboratories-list',
  standalone: true,
  imports: [SlicePipe, MatIconModule, MatTooltipModule, DataTableComponent],
  templateUrl: './laboratories-list.component.html',
  styleUrl: './laboratories-list.component.scss',
})
export class LaboratoriesListComponent implements OnInit, AfterViewInit {
  private service = inject(LaboratoriesService);
  private alert   = inject(AlertService);
  private dialog  = inject(MatDialog);

  items   = signal<LaboratoryDTO[]>([]);
  total   = signal(0);
  loading = signal(false);
  filterActive  = signal<boolean | undefined>(undefined);
  filterCountry = signal('');

  private currentPage   = 1;
  private currentSize   = 10;
  private currentSearch = '';
  private countryTimer: ReturnType<typeof setTimeout> | null = null;

  countryTpl = viewChild.required<TemplateRef<any>>('countryTpl');
  websiteTpl = viewChild.required<TemplateRef<any>>('websiteTpl');
  statusTpl  = viewChild.required<TemplateRef<any>>('statusTpl');

  columns: DataTableColumn[] = [];

  ngOnInit() { this.loadData(); }

  ngAfterViewInit() {
    this.columns = [
      { key: 'name',         label: 'Nombre',   sortable: true },
      { key: 'country_code', label: 'País',      template: this.countryTpl(), sortable: true },
      { key: 'website',      label: 'Sitio web', template: this.websiteTpl(), sortable: false },
      { key: 'is_active',    label: 'Estado',    template: this.statusTpl(),  sortable: false },
    ];
  }

  loadData() {
    this.loading.set(true);
    this.service.getAll({
      search:       this.currentSearch || undefined,
      country_code: this.filterCountry() || undefined,
      is_active:    this.filterActive(),
      per_page:     this.currentSize,
      page:         this.currentPage,
    }).subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.total.set(res.meta.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.alert.error('No se pudieron cargar los laboratorios.');
      }
    });
  }

  onPageChange(event: DataTablePageEvent) {
    this.currentPage   = event.page;
    this.currentSize   = event.pageSize;
    this.currentSearch = event.search;
    this.loadData();
  }

  onCountryInput(event: Event) {
    const value = (event.target as HTMLInputElement).value.toUpperCase();
    this.filterCountry.set(value);
    if (this.countryTimer) clearTimeout(this.countryTimer);
    if (value.length === 0 || value.length === 2) {
      this.countryTimer = setTimeout(() => {
        this.currentPage = 1;
        this.loadData();
      }, 300);
    }
  }

  clearCountry() {
    this.filterCountry.set('');
    this.currentPage = 1;
    this.loadData();
  }

  setActive(value: boolean | undefined) {
    this.filterActive.set(value);
    this.currentPage = 1;
    this.loadData();
  }

  async openCreate() {
    const ref = this.dialog.open(LaboratoryFormDialogComponent, {
      data: { laboratory: null },
      width: '480px', maxWidth: '90vw', autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      this.alert.toast('Laboratorio creado correctamente.', 'success');
      this.loadData();
    }
  }

  async openEdit(laboratory: LaboratoryDTO) {
    const ref = this.dialog.open(LaboratoryFormDialogComponent, {
      data: { laboratory },
      width: '480px', maxWidth: '90vw', autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      this.alert.toast('Laboratorio actualizado correctamente.', 'success');
      this.loadData();
    }
  }

  async deactivate(laboratory: LaboratoryDTO) {
    const confirmed = await this.alert.confirmDelete(laboratory.name);
    if (!confirmed) return;
    this.service.deactivate(laboratory.id).subscribe({
      next:  () => { this.alert.toast('Laboratorio desactivado.', 'success'); this.loadData(); },
      error: () => { this.alert.error('No se pudo desactivar el laboratorio.'); }
    });
  }
}
