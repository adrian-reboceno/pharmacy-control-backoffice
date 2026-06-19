import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UnitsService, UnitDTO } from './units.service';

export interface UnitFormDialogData {
  unit: UnitDTO | null;
}

@Component({
  selector: 'app-unit-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-header">
      <h2>{{ isEdit ? 'Editar unidad' : 'Nueva unidad de medida' }}</h2>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <div mat-dialog-content class="dialog-content">

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" maxlength="80"
                 placeholder="ej. Miligramo" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>El nombre es requerido</mat-error>
          }
          @if (form.get('name')?.hasError('serverError')) {
            <mat-error>{{ form.get('name')?.getError('serverError') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Símbolo</mat-label>
          <input matInput formControlName="symbol" maxlength="20"
                 placeholder="ej. mg" />
          <mat-hint>Abreviatura oficial (máx. 20 caracteres)</mat-hint>
          @if (form.get('symbol')?.hasError('required') && form.get('symbol')?.touched) {
            <mat-error>El símbolo es requerido</mat-error>
          }
          @if (form.get('symbol')?.hasError('serverError')) {
            <mat-error>{{ form.get('symbol')?.getError('serverError') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Tipo</mat-label>
          <mat-select formControlName="type">
            <mat-option value="QUANTITY">
              Cantidad — tabletas, cápsulas, piezas
            </mat-option>
            <mat-option value="CONCENTRATION">
              Concentración / Dosis — mg, mcg, UI
            </mat-option>
          </mat-select>
          @if (form.get('type')?.hasError('required') && form.get('type')?.touched) {
            <mat-error>El tipo es requerido</mat-error>
          }
        </mat-form-field>

      </div>

      <div mat-dialog-actions align="end" class="dialog-actions">
        <button type="button" mat-stroked-button mat-dialog-close>
          Cancelar
        </button>
        <button type="submit" mat-flat-button color="primary"
                [disabled]="form.invalid || saving()">
          @if (saving()) {
            <mat-spinner diameter="18" strokeWidth="2" />
          } @else {
            {{ isEdit ? 'Guardar cambios' : 'Crear unidad' }}
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
      min-width: 380px;
    }
    .full-width { width: 100%; }
    .dialog-actions { padding: 12px 20px 18px !important; gap: 8px; }
    mat-spinner { display: inline-block; }
  `]
})
export class UnitFormDialogComponent implements OnInit {
  private fb      = inject(FormBuilder);
  private service = inject(UnitsService);
  dialogRef       = inject(MatDialogRef<UnitFormDialogComponent>);
  data: UnitFormDialogData = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  isEdit = false;

  form = this.fb.group({
    name:   new FormControl('', { nonNullable: true,
              validators: [Validators.required, Validators.maxLength(80)] }),
    symbol: new FormControl('', { nonNullable: true,
              validators: [Validators.required, Validators.maxLength(20)] }),
    type:   new FormControl<'QUANTITY' | 'CONCENTRATION'>('QUANTITY', {
              nonNullable: true, validators: Validators.required }),
  });

  ngOnInit() {
    this.isEdit = this.data.unit !== null;
    if (this.isEdit && this.data.unit) {
      this.form.patchValue({
        name:   this.data.unit.name,
        symbol: this.data.unit.symbol,
        type:   this.data.unit.type,
      });
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const command = this.form.getRawValue();

    const request = this.isEdit && this.data.unit
      ? this.service.update(this.data.unit.id, command)
      : this.service.create(command);

    request.subscribe({
      next:  (result) => { this.saving.set(false); this.dialogRef.close(result); },
      error: (err)    => {
        this.saving.set(false);
        if (err.status === 409) {
          const msg = err.error?.message ?? 'Nombre o símbolo ya existe.';
          this.form.get('name')?.setErrors({ serverError: msg });
          this.form.get('symbol')?.setErrors({ serverError: msg });
          return;
        }
        if (err.status === 422 && err.error?.errors) {
          Object.entries(err.error.errors as Record<string, string[]>)
            .forEach(([field, msgs]) =>
              this.form.get(field)?.setErrors({ serverError: (msgs as string[])[0] })
            );
        }
      }
    });
  }
}
