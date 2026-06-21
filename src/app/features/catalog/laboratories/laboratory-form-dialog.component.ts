import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LaboratoriesService, LaboratoryDTO } from './laboratories.service';

export interface LaboratoryFormDialogData {
  laboratory: LaboratoryDTO | null;
}

@Component({
  selector: 'app-laboratory-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-header">
      <h2>{{ isEdit ? 'Editar laboratorio' : 'Nuevo laboratorio' }}</h2>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <div mat-dialog-content class="dialog-content">

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" maxlength="120"
                 placeholder="ej. Pfizer" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>El nombre es requerido</mat-error>
          }
          @if (form.get('name')?.hasError('serverError')) {
            <mat-error>{{ form.get('name')?.getError('serverError') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>País (código ISO)</mat-label>
          <input matInput formControlName="country_code" maxlength="2"
                 placeholder="ej. MX"
                 (input)="toUppercase($event)" />
          <mat-hint>Código ISO 3166-1 alpha-2 (2 caracteres, ej. MX, US, DE)</mat-hint>
          @if (form.get('country_code')?.hasError('required') && form.get('country_code')?.touched) {
            <mat-error>El código de país es requerido</mat-error>
          }
          @if (form.get('country_code')?.hasError('minlength') || form.get('country_code')?.hasError('maxlength')) {
            <mat-error>Debe ser exactamente 2 caracteres</mat-error>
          }
          @if (form.get('country_code')?.hasError('serverError')) {
            <mat-error>{{ form.get('country_code')?.getError('serverError') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Sitio web</mat-label>
          <input matInput formControlName="website"
                 placeholder="ej. https://www.pfizer.com" />
          <mat-hint>Opcional — URL completa con https://</mat-hint>
          @if (form.get('website')?.hasError('pattern')) {
            <mat-error>Ingresa una URL válida (ej. https://ejemplo.com)</mat-error>
          }
          @if (form.get('website')?.hasError('serverError')) {
            <mat-error>{{ form.get('website')?.getError('serverError') }}</mat-error>
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
            {{ isEdit ? 'Guardar cambios' : 'Crear laboratorio' }}
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
export class LaboratoryFormDialogComponent implements OnInit {
  private fb      = inject(FormBuilder);
  private service = inject(LaboratoriesService);
  dialogRef       = inject(MatDialogRef<LaboratoryFormDialogComponent>);
  data: LaboratoryFormDialogData = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  isEdit = false;

  private readonly URL_PATTERN = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

  form = this.fb.group({
    name:         new FormControl('', { nonNullable: true,
                    validators: [Validators.required, Validators.maxLength(120)] }),
    country_code: new FormControl('', { nonNullable: true,
                    validators: [Validators.required, Validators.minLength(2), Validators.maxLength(2)] }),
    website:      new FormControl<string | null>(null,
                    Validators.pattern(this.URL_PATTERN)),
  });

  ngOnInit() {
    this.isEdit = this.data.laboratory !== null;
    if (this.isEdit && this.data.laboratory) {
      this.form.patchValue({
        name:         this.data.laboratory.name,
        country_code: this.data.laboratory.country_code,
        website:      this.data.laboratory.website,
      });
    }
  }

  toUppercase(event: Event) {
    const input = event.target as HTMLInputElement;
    const upper = input.value.toUpperCase();
    input.value = upper;
    this.form.get('country_code')?.setValue(upper, { emitEvent: false });
  }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const command = {
      name:         raw.name,
      country_code: raw.country_code.toUpperCase(),
      website:      raw.website || null,
    };

    const request = this.isEdit && this.data.laboratory
      ? this.service.update(this.data.laboratory.id, command)
      : this.service.create(command);

    request.subscribe({
      next:  (result) => { this.saving.set(false); this.dialogRef.close(result); },
      error: (err)    => {
        this.saving.set(false);
        if (err.status === 409) {
          this.form.get('name')?.setErrors({ serverError: 'Este nombre ya está en uso.' });
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
