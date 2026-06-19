import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PresentationsService, PresentationDTO } from './presentations.service';

export interface PresentationFormDialogData {
  presentation: PresentationDTO | null;
}

@Component({
  selector: 'app-presentation-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-header">
      <h2>{{ isEdit ? 'Editar presentación' : 'Nueva presentación' }}</h2>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <div mat-dialog-content class="dialog-content">

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" maxlength="100"
                 placeholder="ej. Tableta" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>El nombre es requerido</mat-error>
          }
          @if (form.get('name')?.hasError('serverError')) {
            <mat-error>{{ form.get('name')?.getError('serverError') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Abreviatura</mat-label>
          <input matInput formControlName="abbreviation" maxlength="20"
                 placeholder="ej. Tab" />
          <mat-hint>Abreviatura oficial (máx. 20 caracteres)</mat-hint>
          @if (form.get('abbreviation')?.hasError('required') && form.get('abbreviation')?.touched) {
            <mat-error>La abreviatura es requerida</mat-error>
          }
          @if (form.get('abbreviation')?.hasError('serverError')) {
            <mat-error>{{ form.get('abbreviation')?.getError('serverError') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="description" rows="3"
                    maxlength="500"
                    placeholder="ej. Forma sólida oral de administración."></textarea>
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
            {{ isEdit ? 'Guardar cambios' : 'Crear presentación' }}
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
export class PresentationFormDialogComponent implements OnInit {
  private fb      = inject(FormBuilder);
  private service = inject(PresentationsService);
  dialogRef       = inject(MatDialogRef<PresentationFormDialogComponent>);
  data: PresentationFormDialogData = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  isEdit = false;

  form = this.fb.group({
    name:         new FormControl('', { nonNullable: true,
                    validators: [Validators.required, Validators.maxLength(100)] }),
    abbreviation: new FormControl('', { nonNullable: true,
                    validators: [Validators.required, Validators.maxLength(20)] }),
    description:  new FormControl<string | null>(null, Validators.maxLength(500)),
  });

  ngOnInit() {
    this.isEdit = this.data.presentation !== null;
    if (this.isEdit && this.data.presentation) {
      this.form.patchValue({
        name:         this.data.presentation.name,
        abbreviation: this.data.presentation.abbreviation,
        description:  this.data.presentation.description,
      });
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const command = {
      name:         raw.name,
      abbreviation: raw.abbreviation,
      description:  raw.description || null,
    };

    const request = this.isEdit && this.data.presentation
      ? this.service.update(this.data.presentation.id, command)
      : this.service.create(command);

    request.subscribe({
      next:  (result) => { this.saving.set(false); this.dialogRef.close(result); },
      error: (err)    => {
        this.saving.set(false);
        if (err.status === 409) {
          const msg = err.error?.message ?? '';
          if (msg.toLowerCase().includes('abreviatura') || msg.toLowerCase().includes('abbreviation')) {
            this.form.get('abbreviation')?.setErrors({ serverError: 'Esta abreviatura ya está en uso.' });
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
