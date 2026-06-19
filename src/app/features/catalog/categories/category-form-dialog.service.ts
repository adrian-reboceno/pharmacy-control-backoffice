import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import {
  CategoryFormDialogComponent, CategoryFormDialogData
} from './category-form-dialog.component';
import { CategoriesService, CategoryDTO } from './categories.service';

@Injectable({ providedIn: 'root' })
export class CategoryFormDialogService {
  private dialog = inject(MatDialog);
  private categoriesService = inject(CategoriesService);

  async openCreate(parentId: string | null): Promise<CategoryDTO | null> {
    const tree = await firstValueFrom(this.categoriesService.getTree());
    return this.open({ category: null, parentId, tree });
  }

  async openEdit(category: CategoryDTO): Promise<CategoryDTO | null> {
    const tree = await firstValueFrom(this.categoriesService.getTree());
    return this.open({ category, parentId: null, tree });
  }

  private async open(data: CategoryFormDialogData): Promise<CategoryDTO | null> {
    const ref = this.dialog.open(CategoryFormDialogComponent, {
      data,
      width: '720px',
      maxWidth: '90vw',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    const result = await firstValueFrom(ref.afterClosed());
    return result ?? null;
  }
}
