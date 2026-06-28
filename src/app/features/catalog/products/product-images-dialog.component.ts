import { Component, inject, signal, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProductsService, ProductDTO, ProductImageDTO } from './products.service';
import { AlertService } from '../../../shared/services/alert.service';
import { environment } from '../../../../environments/environment';

export interface ProductImagesDialogData {
  product: ProductDTO;
}

@Component({
  selector: 'app-product-images-dialog',
  standalone: true,
  imports: [
    MatDialogModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule,
  ],
  templateUrl: './product-images-dialog.component.html',
  styleUrl:    './product-images-dialog.component.scss',
})
export class ProductImagesDialogComponent implements OnInit {
  private service = inject(ProductsService);
  private alert   = inject(AlertService);
  dialogRef       = inject(MatDialogRef<ProductImagesDialogComponent>);
  data: ProductImagesDialogData = inject(MAT_DIALOG_DATA);

  images     = signal<ProductImageDTO[]>([]);
  uploading  = signal(false);
  deletingId = signal<string | null>(null);

  readonly apiBase = environment.apiUrl.replace('/api/v1', '');

  ngOnInit() {
    this.service.getById(this.data.product.id).subscribe({
      next: (res: any) => {
        this.images.set(res.data.images ?? []);
      },
      error: () => this.alert.error('No se pudieron cargar las imágenes.')
    });
  }

  imageUrl(url: string): string {
    return `${this.apiBase}${url}`;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const files = Array.from(input.files);
    input.value = '';
    this.uploading.set(true);
    let pending = files.length;
    files.forEach(file => {
      this.service.uploadImage(this.data.product.id, file).subscribe({
        next: (updated) => {
          this.images.set(updated.data.images ?? []);
          pending--;
          if (pending === 0) this.uploading.set(false);
        },
        error: () => {
          pending--;
          if (pending === 0) this.uploading.set(false);
          this.alert.error('No se pudo subir la imagen.');
        }
      });
    });
  }

  confirmingId = signal<string | null>(null);

  deleteImage(img: ProductImageDTO) {
    if (this.confirmingId() !== img.id) {
      this.confirmingId.set(img.id);
      setTimeout(() => this.confirmingId.set(null), 3000);
      return;
    }
    this.confirmingId.set(null);
    this.deletingId.set(img.id);
    this.service.deleteImage(this.data.product.id, img.id).subscribe({
      next: () => {
        this.images.update(imgs => imgs.filter(i => i.id !== img.id));
        this.deletingId.set(null);
      },
      error: () => {
        this.deletingId.set(null);
        this.alert.error('No se pudo eliminar la imagen.');
      }
    });
  }

  close() {
    const changed = this.images().length !== (this.data.product.images ?? []).length;
    this.dialogRef.close(changed);
  }
}