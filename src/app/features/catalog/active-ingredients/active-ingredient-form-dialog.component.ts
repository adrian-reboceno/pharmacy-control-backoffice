import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActiveIngredientsService, ActiveIngredientDTO } from './active-ingredients.service';

export interface ActiveIngredientFormDialogData {
  ingredient: ActiveIngredientDTO | null;
}

@Component({
  selector: 'app-active-ingredient-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-header">
      <h2>{{ isEdit ? 'Editar ingrediente activo' : 'Nuevo ingrediente activo' }}</h2>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <div mat-dialog-content class="dialog-content">

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" maxlength="150"
                 placeholder="ej. Amoxicilina" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>El nombre es requerido</mat-error>
          }
          @if (form.get('name')?.hasError('serverError')) {
            <mat-error>{{ form.get('name')?.getError('serverError') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Código DCI</mat-label>
          <input matInput formControlName="dci_code" maxlength="30"
                 placeholder="ej. amoxicillin" />
          <mat-hint>Denominación Común Internacional (INN) — máx. 30 caracteres</mat-hint>
          @if (form.get('dci_code')?.hasError('required') && form.get('dci_code')?.touched) {
            <mat-error>El código DCI es requerido</mat-error>
          }
          @if (form.get('dci_code')?.hasError('serverError')) {
            <mat-error>{{ form.get('dci_code')?.getError('serverError') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Número CAS</mat-label>
          <input matInput formControlName="cas_number"
                 placeholder="ej. 26787-78-0" />
          <mat-hint>Opcional — formato: NNNNNN-NN-N (ej. 26787-78-0)</mat-hint>
          @if (form.get('cas_number')?.hasError('pattern')) {
            <mat-error>Formato inválido. Use NNNNNN-NN-N (ej. 26787-78-0)</mat-error>
          }
          @if (form.get('cas_number')?.hasError('serverError')) {
            <mat-error>{{ form.get('cas_number')?.getError('serverError') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="description" rows="3"
                    maxlength="500"
                    placeholder="ej. Antibiótico betalactámico de amplio espectro."></textarea>
          <mat-hint>Opcional — máx. 500 caracteres</mat-hint>
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
            {{ isEdit ? 'Guardar cambios' : 'Crear ingrediente' }}
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
      min-width: 440px;
    }
    .full-width { width: 100%; }
    .dialog-actions { padding: 12px 20px 18px !important; gap: 8px; }
    mat-spinner { display: inline-block; }
  `]
})
export class ActiveIngredientFormDialogComponent implements OnInit {
  private fb      = inject(FormBuilder);
  private service = inject(ActiveIngredientsService);
  dialogRef       = inject(MatDialogRef<ActiveIngredientFormDialogComponent>);
  data: ActiveIngredientFormDialogData = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  isEdit = false;

  private readonly CAS_PATTERN = /^\d{2,7}-\d{2}-\d$/;

  form = this.fb.group({
    name:        new FormControl('', { nonNullable: true,
                   validators: [Validators.required, Validators.maxLength(150)] }),
    dci_code:    new FormControl('', { nonNullable: true,
                   validators: [Validators.required, Validators.maxLength(30)] }),
    cas_number:  new FormControl<string | null>(null,
                   Validators.pattern(this.CAS_PATTERN)),
    description: new FormControl<string | null>(null, Validators.maxLength(500)),
  });

  ngOnInit() {
    this.isEdit = this.data.ingredient !== null;
    if (this.isEdit && this.data.ingredient) {
      this.form.patchValue({
        name:        this.data.ingredient.name,
        dci_code:    this.data.ingredient.dci_code,
        cas_number:  this.data.ingredient.cas_number,
        description: this.data.ingredient.description,
      });
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const command = {
      name:        raw.name,
      dci_code:    raw.dci_code,
      cas_number:  raw.cas_number || null,
      description: raw.description || null,
    };

    const request = this.isEdit && this.data.ingredient
      ? this.service.update(this.data.ingredient.id, command)
      : this.service.create(command);

    request.subscribe({
      next:  (result) => { this.saving.set(false); this.dialogRef.close(result); },
      error: (err)    => {
        this.saving.set(false);
        if (err.status === 409) {
          const msg = (err.error?.message ?? '').toLowerCase();
          if (msg.includes('cas')) {
            this.form.get('cas_number')?.setErrors({ serverError: 'Este número CAS ya está registrado.' });
          } else if (msg.includes('dci') || msg.includes('code')) {
            this.form.get('dci_code')?.setErrors({ serverError: 'Este código DCI ya está en uso.' });
          } else {
            this.form.get('name')?.setErrors({ serverError: 'Este nombre ya está en uso.' });
          }
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
