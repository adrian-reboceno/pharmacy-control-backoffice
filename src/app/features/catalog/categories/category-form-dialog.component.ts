import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogModule
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  CategoriesService, CategoryDTO, CategoryTreeNode
} from './categories.service';

export interface CategoryFormDialogData {
  category: CategoryDTO | null;
  parentId: string | null;
  tree:     CategoryTreeNode[];
}

interface FlatCategoryOption {
  id:     string;
  name:   string;
  indent: string;
}

@Component({
  selector: 'app-category-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './category-form-dialog.component.html',
  styleUrl: './category-form-dialog.component.scss',
})
export class CategoryFormDialogComponent implements OnInit {
  private fb       = inject(FormBuilder);
  private service  = inject(CategoriesService);
  dialogRef        = inject(MatDialogRef<CategoryFormDialogComponent>);
  data: CategoryFormDialogData = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  isEdit = false;
  flatCategories = signal<FlatCategoryOption[]>([]);

  form = this.fb.group({
    name:        new FormControl('', { nonNullable: true,
                    validators: [Validators.required, Validators.maxLength(120)] }),
    slug:        new FormControl<string | null>(null,
                    Validators.pattern(/^[a-z0-9]+(-[a-z0-9]+)*$/)),
    parent_id:   new FormControl<string | null>(null),
    description: new FormControl<string | null>(null, Validators.maxLength(500)),
  });

  /** Nombre legible del padre seleccionado, para la vista previa. */
  parentName = computed(() => {
    const parentId = this.form.get('parent_id')?.value;
    if (!parentId) return null;
    const found = this.flatCategories().find(c => c.id === parentId);
    return found?.name ?? null;
  });

  ngOnInit() {
    this.isEdit = this.data.category !== null;
    this.flatCategories.set(this.flattenTree(this.data.tree));

    if (this.isEdit && this.data.category) {
      const c = this.data.category;
      this.form.patchValue({
        name:        c.name,
        slug:        c.slug,
        parent_id:   c.parent_id,
        description: c.description,
      });
    } else if (this.data.parentId) {
      this.form.patchValue({ parent_id: this.data.parentId });
    }

    // Mantener la vista previa reactiva: forzamos a Angular a leer el
    // computed en cada cambio de parent_id suscribiéndonos explícitamente,
    // ya que parent_id no es un signal nativo de Angular Forms.
    this.form.get('parent_id')?.valueChanges.subscribe(() => {
      this.flatCategories.set([...this.flatCategories()]);
    });
  }

  private flattenTree(nodes: CategoryTreeNode[], depth = 0): FlatCategoryOption[] {
    const result: FlatCategoryOption[] = [];
    for (const node of nodes) {
      result.push({ id: node.id, name: node.name, indent: '—'.repeat(depth) + (depth > 0 ? ' ' : '') });
      if (node.children?.length) {
        result.push(...this.flattenTree(node.children, depth + 1));
      }
    }
    return result;
  }

  autoSlug() {
    if (this.isEdit) return;
    const current = this.form.get('slug')?.value;
    if (current) return;

    const name = this.form.getRawValue().name;
    const slug = name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    this.form.get('slug')?.setValue(slug);
  }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);

    const raw = this.form.getRawValue();
    const command = {
      name:        raw.name,
      slug:        raw.slug || null,
      parent_id:   raw.parent_id || null,
      description: raw.description || null,
    };

    const request = this.isEdit && this.data.category
      ? this.service.update(this.data.category.id, command)
      : this.service.create(command);

    request.subscribe({
      next:  (result) => {
        this.saving.set(false);
        this.dialogRef.close(result);
      },
      error: (err) => {
        this.saving.set(false);
        this.handleApiError(err);
      }
    });
  }

  private handleApiError(err: any) {
    if (err.status === 409) {
      this.form.get('slug')?.setErrors({ serverError: 'Este slug ya está en uso.' });
      return;
    }
    if (err.status === 422 && err.error?.error === 'CYCLE_DETECTED') {
      this.form.get('parent_id')?.setErrors({
        serverError: 'No se puede asignar como padre porque crearía un ciclo.'
      });
      return;
    }
    if (err.status === 422 && err.error?.errors) {
      Object.entries(err.error.errors as Record<string, string[]>).forEach(([field, messages]) => {
        this.form.get(field)?.setErrors({ serverError: messages[0] });
      });
      return;
    }
    if (err.status === 404) {
      this.form.get('parent_id')?.setErrors({ serverError: 'La categoría padre no existe.' });
      return;
    }
  }
}
