import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LocationsService, LocationDTO } from './locations.service';

export interface LocationFormDialogData {
  location:  LocationDTO | null;
  parentId:  string | null;
  parentLevel: number | null;
  allNodes:  LocationDTO[];
}

interface FlatOption { id: string; label: string; level: number; }

@Component({
  selector: 'app-location-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-header">
      <h2>{{ isEdit ? 'Editar ubicación' : 'Nueva ubicación' }}</h2>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <div mat-dialog-content class="dialog-content">

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Nivel</mat-label>
          <mat-select formControlName="level" (selectionChange)="onLevelChange()">
            <mat-option [value]="1">Zona (nivel 1)</mat-option>
            <mat-option [value]="2">Pasillo (nivel 2)</mat-option>
            <mat-option [value]="3">Estante (nivel 3)</mat-option>
            <mat-option [value]="4">Posición (nivel 4)</mat-option>
          </mat-select>
          @if (isEdit) {
            <mat-hint>El nivel no puede modificarse tras la creación</mat-hint>
          }
        </mat-form-field>

        @if ((form.get('level')?.value ?? 0) > 1) {
          <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
            <mat-label>{{ parentLabel() }}</mat-label>
            <mat-select formControlName="parent_id">
              @for (opt of parentOptions(); track opt.id) {
                <mat-option [value]="opt.id">{{ opt.label }}</mat-option>
              }
            </mat-select>
            @if (form.get('parent_id')?.hasError('required') && form.get('parent_id')?.touched) {
              <mat-error>El padre es requerido para este nivel</mat-error>
            }
            @if (form.get('parent_id')?.hasError('serverError')) {
              <mat-error>{{ form.get('parent_id')?.getError('serverError') }}</mat-error>
            }
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" maxlength="100"
                 placeholder="{{ namePlaceholder() }}" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>El nombre es requerido</mat-error>
          }
          @if (form.get('name')?.hasError('serverError')) {
            <mat-error>{{ form.get('name')?.getError('serverError') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="description" rows="2"
                    maxlength="255" placeholder="Opcional"></textarea>
        </mat-form-field>

      </div>

      <div mat-dialog-actions align="end" class="dialog-actions">
        <button type="button" mat-stroked-button mat-dialog-close>Cancelar</button>
        <button type="submit" mat-flat-button color="primary"
                [disabled]="form.invalid || saving()">
          @if (saving()) {
            <mat-spinner diameter="18" strokeWidth="2" />
          } @else {
            {{ isEdit ? 'Guardar cambios' : 'Crear ubicación' }}
          }
        </button>
      </div>
    </form>
  `,
  styles: [`
    .dialog-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 18px 20px 0;
      h2 { font-size: 1.05rem; font-weight: 700; color: #212529; margin: 0; }
    }
    .dialog-content {
      padding: 16px 20px !important;
      display: flex; flex-direction: column; gap: 16px;
      min-width: 420px;
    }
    .full-width { width: 100%; }
    .dialog-actions { padding: 12px 20px 18px !important; gap: 8px; }
    mat-spinner { display: inline-block; }
  `]
})
export class LocationFormDialogComponent implements OnInit {
  private fb      = inject(FormBuilder);
  private service = inject(LocationsService);
  dialogRef       = inject(MatDialogRef<LocationFormDialogComponent>);
  data: LocationFormDialogData = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  isEdit = false;
  parentOptions = signal<FlatOption[]>([]);

  form = this.fb.group({
    level:       new FormControl<1|2|3|4>(1, { nonNullable: true, validators: Validators.required }),
    parent_id:   new FormControl<string | null>(null),
    name:        new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    description: new FormControl<string | null>(null, Validators.maxLength(255)),
  });

  ngOnInit() {
    this.isEdit = this.data.location !== null;

    if (this.isEdit && this.data.location) {
      const l = this.data.location;
      this.form.patchValue({
        level:       l.level,
        parent_id:   l.parent_id,
        name:        l.name,
        description: l.description,
      });
      this.form.get('level')?.disable();
      this.form.get('parent_id')?.disable();
    } else {
      if (this.data.parentId) {
        this.form.patchValue({ parent_id: this.data.parentId });
      }
      if (this.data.parentLevel) {
        const childLevel = (this.data.parentLevel + 1) as 1|2|3|4;
        this.form.patchValue({ level: childLevel });
      }
    }

    this.updateParentOptions();
    this.updateParentValidators();
  }

  onLevelChange() {
    this.form.get('parent_id')?.setValue(null);
    this.updateParentOptions();
    this.updateParentValidators();
  }

  private updateParentOptions() {
    const level = this.form.getRawValue().level;
    const parentLevel = level - 1;
    if (parentLevel < 1) { this.parentOptions.set([]); return; }

    const opts: FlatOption[] = [];
    const walk = (nodes: LocationDTO[], depth = 0) => {
      for (const n of nodes) {
        if (n.level === parentLevel) {
          opts.push({ id: n.id, label: '  '.repeat(depth) + n.name, level: n.level });
        }
        if (n.children?.length) walk(n.children, depth + 1);
      }
    };
    walk(this.data.allNodes);
    this.parentOptions.set(opts);
  }

  private updateParentValidators() {
    const level = this.form.getRawValue().level;
    const ctrl = this.form.get('parent_id');
    if (level > 1) {
      ctrl?.setValidators(Validators.required);
    } else {
      ctrl?.clearValidators();
      ctrl?.setValue(null);
    }
    ctrl?.updateValueAndValidity();
  }

  parentLabel(): string {
    const level = this.form.getRawValue().level;
    return level === 2 ? 'Zona padre' : level === 3 ? 'Pasillo padre' : 'Estante padre';
  }

  namePlaceholder(): string {
    const level = this.form.getRawValue().level;
    const map: Record<number, string> = { 1: 'ej. OTC General', 2: 'ej. Pasillo A', 3: 'ej. Estante 1', 4: 'ej. Posición 01' };
    return map[level] ?? '';
  }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();

    if (this.isEdit && this.data.location) {
      this.service.update(this.data.location.id, {
        name:        raw.name,
        description: raw.description || null,
      }).subscribe({
        next:  (r) => { this.saving.set(false); this.dialogRef.close(r); },
        error: (e) => { this.saving.set(false); this.handleError(e); }
      });
    } else {
      this.service.create({
        name:        raw.name,
        level:       raw.level,
        parent_id:   raw.parent_id || null,
        description: raw.description || null,
      }).subscribe({
        next:  (r) => { this.saving.set(false); this.dialogRef.close(r); },
        error: (e) => { this.saving.set(false); this.handleError(e); }
      });
    }
  }

  private handleError(err: any) {
    if (err.status === 409) {
      this.form.get('name')?.setErrors({ serverError: 'Este nombre ya existe en el mismo nivel.' });
      return;
    }
    if (err.status === 422) {
      const msg = err.error?.message ?? '';
      if (msg.toLowerCase().includes('nivel') || msg.toLowerCase().includes('level')) {
        this.form.get('parent_id')?.setErrors({ serverError: 'El nivel no es válido para el padre seleccionado.' });
      } else if (err.error?.errors) {
        Object.entries(err.error.errors as Record<string, string[]>)
          .forEach(([field, msgs]) =>
            this.form.get(field)?.setErrors({ serverError: (msgs as string[])[0] })
          );
      }
    }
  }
}
