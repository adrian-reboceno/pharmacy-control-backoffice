import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StatusesService, StatusDTO } from './statuses.service';

export interface StatusFormDialogData {
  status: StatusDTO | null;
}

@Component({
  selector: 'app-status-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-header">
      <h2>{{ isEdit ? 'Editar estado' : 'Nuevo estado de producto' }}</h2>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <div mat-dialog-content class="dialog-content">

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" maxlength="50"
                 placeholder="ej. En revisión" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>El nombre es requerido</mat-error>
          }
          @if (form.get('name')?.hasError('serverError')) {
            <mat-error>{{ form.get('name')?.getError('serverError') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Código</mat-label>
          <input matInput formControlName="code" maxlength="20"
                 placeholder="ej. EN_REVISION"
                 (input)="toUppercase($event)" />
          <mat-hint>Solo mayúsculas y guiones bajos (máx. 20 caracteres)</mat-hint>
          @if (form.get('code')?.hasError('required') && form.get('code')?.touched) {
            <mat-error>El código es requerido</mat-error>
          }
          @if (form.get('code')?.hasError('serverError')) {
            <mat-error>{{ form.get('code')?.getError('serverError') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="description" rows="3"
                    maxlength="255"
                    placeholder="ej. El producto está disponible para venta."></textarea>
          <mat-hint>Opcional — máx. 255 caracteres</mat-hint>
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
            {{ isEdit ? 'Guardar cambios' : 'Crear estado' }}
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
      min-width: 400px;
    }
    .full-width { width: 100%; }
    .dialog-actions { padding: 12px 20px 18px !important; gap: 8px; }
    mat-spinner { display: inline-block; }
  `]
})
export class StatusFormDialogComponent implements OnInit {
  private fb      = inject(FormBuilder);
  private service = inject(StatusesService);
  dialogRef       = inject(MatDialogRef<StatusFormDialogComponent>);
  data: StatusFormDialogData = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  isEdit = false;

  form = this.fb.group({
    name:        new FormControl('', { nonNullable: true,
                   validators: [Validators.required, Validators.maxLength(50)] }),
    code:        new FormControl('', { nonNullable: true,
                   validators: [Validators.required, Validators.maxLength(20)] }),
    description: new FormControl<string | null>(null, Validators.maxLength(255)),
  });

  ngOnInit() {
    this.isEdit = this.data.status !== null;
    if (this.isEdit && this.data.status) {
      this.form.patchValue({
        name:        this.data.status.name,
        code:        this.data.status.code,
        description: this.data.status.description,
      });
    }
  }

  toUppercase(event: Event) {
    const input = event.target as HTMLInputElement;
    const upper = input.value.toUpperCase();
    input.value = upper;
    this.form.get('code')?.setValue(upper, { emitEvent: false });
  }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const command = {
      name:        raw.name,
      code:        raw.code.toUpperCase(),
      description: raw.description || null,
    };

    const request = this.isEdit && this.data.status
      ? this.service.update(this.data.status.id, command)
      : this.service.create(command);

    request.subscribe({
      next:  (result) => { this.saving.set(false); this.dialogRef.close(result); },
      error: (err)    => {
        this.saving.set(false);
        if (err.status === 409) {
          const msg = err.error?.message ?? '';
          if (msg.toLowerCase().includes('código') || msg.toLowerCase().includes('code')) {
            this.form.get('code')?.setErrors({ serverError: 'Este código ya está en uso.' });
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
