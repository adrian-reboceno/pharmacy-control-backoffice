import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ProductsService, ProductDTO, ProductImageDTO } from './products.service';
import { AlertService } from '../../../shared/services/alert.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ProductFormDialogComponent } from './product-form-dialog.component';
import { ProductImagesDialogComponent } from './product-images-dialog.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private service = inject(ProductsService);
  private alert   = inject(AlertService);
  private dialog  = inject(MatDialog);
  private auth    = inject(AuthService);

  product  = signal<ProductDTO | null>(null);
  loading  = signal(true);
  activeImg = signal<ProductImageDTO | null>(null);
  activeTab = signal<'general' | 'specs' | 'ingredients'>('general');

  canEdit       = computed(() => this.auth.hasPermission('catalog.products.edit'));
  canDeactivate = computed(() => this.auth.hasPermission('catalog.products.deactivate'));

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.getById(id).subscribe({
      next: (res: any) => {
        const p: ProductDTO = res.data ?? res;
        this.product.set(p);
        this.activeImg.set(p.images?.[0] ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.alert.error('No se pudo cargar el producto.');
        this.router.navigate(['/catalog/products']);
      }
    });
  }

  setActiveImg(img: ProductImageDTO) { this.activeImg.set(img); }
  setTab(tab: 'general' | 'specs' | 'ingredients') { this.activeTab.set(tab); }

  goBack() { this.router.navigate(['/catalog/products']); }

  async openEdit() {
    const p = this.product();
    if (!p) return;
    const ref = this.dialog.open(ProductFormDialogComponent, {
      data: { product: p },
      width: '780px', maxWidth: '95vw', autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      this.alert.toast('Producto actualizado.', 'success');
      this.ngOnInit();
    }
  }

  async openImages() {
    const p = this.product();
    if (!p) return;
    const ref = this.dialog.open(ProductImagesDialogComponent, {
      data: { product: p },
      width: '700px', maxWidth: '95vw',
    });
    await firstValueFrom(ref.afterClosed());
    this.ngOnInit();
  }

  async deactivate() {
    const p = this.product();
    if (!p) return;
    const confirmed = await this.alert.confirmDelete(p.name);
    if (!confirmed) return;
    this.service.deactivate(p.id).subscribe({
      next: () => {
        this.alert.toast('Producto desactivado.', 'success');
        this.router.navigate(['/catalog/products']);
      },
      error: () => this.alert.error('No se pudo desactivar el producto.')
    });
  }
}