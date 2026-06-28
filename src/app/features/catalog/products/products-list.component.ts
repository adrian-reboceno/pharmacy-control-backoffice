import {
  Component, inject, signal, OnInit,
  TemplateRef, viewChild, computed, effect
} from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ProductsService, ProductDTO } from './products.service';
import { AlertService } from '../../../shared/services/alert.service';
import { AuthService } from '../../../core/auth/auth.service';
import {
  DataTableComponent, DataTableColumn, DataTablePageEvent
} from '../../../shared/components/data-table/data-table.component';
import { ProductFormDialogComponent } from './product-form-dialog.component';
import { ProductImagesDialogComponent } from './product-images-dialog.component';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [LowerCasePipe, MatIconModule, MatTooltipModule, MatMenuModule, DataTableComponent],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.scss',
})
export class ProductsListComponent implements OnInit {
  private service = inject(ProductsService);
  private alert   = inject(AlertService);
  private dialog  = inject(MatDialog);
  private auth    = inject(AuthService);
  private router = inject(Router);

  items   = signal<ProductDTO[]>([]);
  total   = signal(0);
  loading = signal(false);

  filterType   = signal<'GENERIC' | 'BRANDED' | undefined>(undefined);
  filterSale   = signal<string | undefined>(undefined);
  filterActive = signal<boolean | undefined>(undefined);

  canCreate     = computed(() => this.auth.hasPermission('catalog.products.create'));
  canEdit       = computed(() => this.auth.hasPermission('catalog.products.edit'));
  canDeactivate = computed(() => this.auth.hasPermission('catalog.products.deactivate'));

  private currentPage   = 1;
  private currentSize   = 10;
  private currentSearch = '';

  typeTpl      = viewChild<TemplateRef<any>>('typeTpl');
  saleTpl      = viewChild<TemplateRef<any>>('saleTpl');
  statusTpl    = viewChild<TemplateRef<any>>('statusTpl');
 
  columns = signal<DataTableColumn[]>([]);

  constructor() {
    effect(() => {
      const type = this.typeTpl();
      const sale = this.saleTpl();
      const stat = this.statusTpl();
      if (type && sale && stat) {
        this.columns.set([
          { key: 'name',           label: 'Nombre',    sortable: true },
          { key: 'type',           label: 'Tipo',      template: type, sortable: false },
          { key: 'sale_condition', label: 'Condición', template: sale, sortable: false },
          { key: 'is_active',      label: 'Estado',    template: stat, sortable: false },
        ]);
      }
    });
  }

  ngOnInit() { this.loadData(); }

  loadData() {
    this.loading.set(true);
    this.service.getAll({
      search:         this.currentSearch || undefined,
      type:           this.filterType(),
      sale_condition: this.filterSale(),
      is_active:      this.filterActive(),
      per_page:       this.currentSize,
      page:           this.currentPage,
    }).subscribe({
      next: (res) => {
        this.items.set(res.data);
        this.total.set(res.meta.total);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.alert.error('No se pudieron cargar los productos.');
      }
    });
  }

  onPageChange(event: DataTablePageEvent) {
    this.currentPage   = event.page;
    this.currentSize   = event.pageSize;
    this.currentSearch = event.search;
    this.loadData();
  }

  setType(value: 'GENERIC' | 'BRANDED' | undefined) { this.filterType.set(value);  this.currentPage = 1; this.loadData(); }
  setSale(value: string | undefined)                  { this.filterSale.set(value);  this.currentPage = 1; this.loadData(); }
  setActive(value: boolean | undefined)               { this.filterActive.set(value); this.currentPage = 1; this.loadData(); }

  async openCreate() {
    const ref = this.dialog.open(ProductFormDialogComponent, {
      data: { product: null },
      width: '780px', maxWidth: '95vw', autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) { this.alert.toast('Producto creado correctamente.', 'success'); this.loadData(); }
  }

  async openEdit(product: ProductDTO) {
    const ref = this.dialog.open(ProductFormDialogComponent, {
      data: { product },
      width: '780px', maxWidth: '95vw', autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) { this.alert.toast('Producto actualizado correctamente.', 'success'); this.loadData(); }
  }

  async openImages(product: ProductDTO) {
    const ref = this.dialog.open(ProductImagesDialogComponent, {
      data: { product },
      width: '700px', maxWidth: '95vw',
    });
    const changed = await firstValueFrom(ref.afterClosed());
    if (changed) this.loadData();
  }

  openStock(product: ProductDTO) {
    // TODO: implementar entrada de stock
  }

  async deactivate(product: ProductDTO) {
    const confirmed = await this.alert.confirmDelete(product.name);
    if (!confirmed) return;
    this.service.deactivate(product.id).subscribe({
      next:  () => { this.alert.toast('Producto desactivado.', 'success'); this.loadData(); },
      error: () => { this.alert.error('No se pudo desactivar el producto.'); }
    });
  }

  openView(product: ProductDTO) {
    this.router.navigate(['/catalog/products', product.id]);
  }

}