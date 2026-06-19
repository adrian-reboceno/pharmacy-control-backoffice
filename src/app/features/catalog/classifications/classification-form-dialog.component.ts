import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClassificationsService, ClassificationDTO } from './classifications.service';

@Component({
  selector: 'app-classification-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-header">
      <div>
        <h2>Editar clasificación</h2>
        <span class="group-label">{{ data.lgs_group_label }}</span>
      </div>
      <button mat-icon-button mat-dialog-close><mat-icon>close</mat-icon></button>
    </div>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <div mat-dialog-content class="dialog-content">

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" maxlength="100" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>El nombre es requerido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Tipo de receta</mat-label>
          <mat-select formControlName="prescription_type">
            <mat-option value="CON_CODIGO_BARRAS">Con código de barras</mat-option>
            <mat-option value="NORMAL">Receta normal</mat-option>
            <mat-option value="SIN_RECETA">Sin receta</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Vigencia (días)</mat-label>
          <input matInput formControlName="validity_days" type="number" min="1" max="365" />
          <mat-hint>Dejar vacío si no aplica</mat-hint>
          @if (form.get('validity_days')?.hasError('min') || form.get('validity_days')?.hasError('max')) {
            <mat-error>Entre 1 y 365 días</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Nota de vigencia</mat-label>
          <textarea matInput formControlName="validity_note" rows="2" maxlength="255"></textarea>
          <mat-hint>Ej. Máximo 2 presentaciones por receta.</mat-hint>
        </mat-form-field>

        <div class="readonly-info">
          <mat-icon>info</mat-icon>
          <span>El grupo LGS <strong>{{ data.lgs_group }}</strong> es inmutable por ley y no puede modificarse.</span>
        </div>

      </div>

      <div mat-dialog-actions align="end" class="dialog-actions">
        <button type="button" mat-stroked-button mat-dialog-close>Cancelar</button>
        <button type="submit" mat-flat-button color="primary" [disabled]="form.invalid || saving()">
          @if (saving()) { <mat-spinner diameter="18" strokeWidth="2" /> }
          @else { Guardar cambios }
        </button>
      </div>
    </form>
  `,
  styles: [`
    .dialog-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 18px 20px 0;
      h2 { font-size: 1.05rem; font-weight: 700; color: #212529; margin: 0 0 2px; }
    }
    .group-label { font-size: 0.78rem; color: #6c757d; }
    .dialog-content { padding: 16px 20px !important; display: flex; flex-direction: column; gap: 16px; }
    .full-width { width: 100%; }
    .dialog-actions { padding: 12px 20px 18px !important; gap: 8px; }
    .readonly-info {
      display: flex; align-items: center; gap: 8px;
      background: #f3f6f9; border-radius: 8px; padding: 10px 14px;
      font-size: 0.82rem; color: #6c757d;
      mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; }
    }
    mat-spinner { display: inline-block; }
  `]
})
export class ClassificationFormDialogComponent implements OnInit {
  private fb      = inject(FormBuilder);
  private service = inject(ClassificationsService);
  dialogRef       = inject(MatDialogRef<ClassificationFormDialogComponent>);
  data: ClassificationDTO = inject(MAT_DIALOG_DATA);

  saving = signal(false);

  form = this.fb.group({
    name:              new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    prescription_type: new FormControl<'CON_CODIGO_BARRAS' | 'NORMAL' | 'SIN_RECETA'>('NORMAL', { nonNullable: true, validators: Validators.required }),
    validity_days:     new FormControl<number | null>(null, [Validators.min(1), Validators.max(365)]),
    validity_note:     new FormControl<string | null>(null, Validators.maxLength(255)),
  });

  ngOnInit() {
    this.form.patchValue({
      name:              this.data.name,
      prescription_type: this.data.prescription_type,
      validity_days:     this.data.validity_days,
      validity_note:     this.data.validity_note,
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();

    this.service.update(this.data.id, {
      name:              raw.name,
      prescription_type: raw.prescription_type,
      validity_days:     raw.validity_days || null,
      validity_note:     raw.validity_note  || null,
    }).subscribe({
      next:  (result) => { this.saving.set(false); this.dialogRef.close(result); },
      error: (err) => {
        this.saving.set(false);
        if (err.status === 422 && err.error?.errors) {
          Object.entries(err.error.errors as Record<string, string[]>).forEach(([field, msgs]) => {
            this.form.get(field)?.setErrors({ serverError: (msgs as string[])[0] });
          });
        }
      }
    });
  }
}
