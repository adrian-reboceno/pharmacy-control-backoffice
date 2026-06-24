import { Component, inject, signal, OnInit } from '@angular/core';
import {
  FormBuilder, FormControl, FormGroup,
  ReactiveFormsModule, Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SuppliersService, SupplierDTO } from './suppliers.service';

export interface SupplierFormDialogData {
  supplier: SupplierDTO | null;
}

@Component({
  selector: 'app-supplier-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatTabsModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="dialog-header">
      <h2>{{ isEdit ? 'Editar proveedor' : 'Nuevo proveedor' }}</h2>
      <button mat-icon-button mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <form [formGroup]="form" (ngSubmit)="submit()">
      <div mat-dialog-content class="dialog-content">
        <mat-tab-group animationDuration="150ms">

          <!-- ── Tab 1: Datos generales ── -->
          <mat-tab label="Datos generales">
            <div class="tab-content">

              <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                <mat-label>Tipo de persona</mat-label>
                <mat-select formControlName="type" (selectionChange)="onTypeChange()">
                  <mat-option value="MORAL">Persona Moral</mat-option>
                  <mat-option value="FISICA">Persona Física</mat-option>
                </mat-select>
                @if (isEdit) {
                  <mat-hint>El tipo no puede modificarse tras la creación</mat-hint>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                <mat-label>RFC</mat-label>
                <input matInput formControlName="rfc" maxlength="13"
                       placeholder="{{ form.get('type')?.value === 'MORAL' ? '12 caracteres' : '13 caracteres' }}"
                       (input)="toUppercase($event, 'rfc')" />
                <mat-hint>
                  {{ form.get('type')?.value === 'MORAL' ? 'Persona Moral: 12 caracteres' : 'Persona Física: 13 caracteres' }}
                  — opcional para proveedores extranjeros
                </mat-hint>
                @if (form.get('rfc')?.hasError('minlength') || form.get('rfc')?.hasError('maxlength')) {
                  <mat-error>
                    RFC debe tener {{ form.get('type')?.value === 'MORAL' ? '12' : '13' }} caracteres
                  </mat-error>
                }
                @if (form.get('rfc')?.hasError('serverError')) {
                  <mat-error>{{ form.get('rfc')?.getError('serverError') }}</mat-error>
                }
                @if (isEdit) {
                  <mat-hint>El RFC no puede modificarse tras la creación</mat-hint>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                <mat-label>Razón social</mat-label>
                <input matInput formControlName="legal_name" maxlength="200"
                       placeholder="ej. Distribuidora Farmacéutica S.A. de C.V." />
                @if (form.get('legal_name')?.hasError('required') && form.get('legal_name')?.touched) {
                  <mat-error>La razón social es requerida</mat-error>
                }
                @if (form.get('legal_name')?.hasError('serverError')) {
                  <mat-error>{{ form.get('legal_name')?.getError('serverError') }}</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                <mat-label>Nombre comercial</mat-label>
                <input matInput formControlName="trade_name" maxlength="150"
                       placeholder="ej. DFC" />
                <mat-hint>Opcional</mat-hint>
              </mat-form-field>

              <div class="row-2">
                <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                  <mat-label>Teléfono</mat-label>
                  <input matInput formControlName="phone" maxlength="20"
                         placeholder="ej. 2221234567" />
                  <mat-hint>Opcional</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                  <mat-label>Correo electrónico</mat-label>
                  <input matInput formControlName="email" type="email"
                         placeholder="ej. contacto@empresa.mx" />
                  @if (form.get('email')?.hasError('email')) {
                    <mat-error>Ingresa un correo válido</mat-error>
                  }
                  <mat-hint>Opcional</mat-hint>
                </mat-form-field>
              </div>

            </div>
          </mat-tab>

          <!-- ── Tab 2: Dirección ── -->
          <mat-tab label="Dirección">
            <div class="tab-content" formGroupName="address">

              <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                <mat-label>Calle</mat-label>
                <input matInput formControlName="street" maxlength="150"
                       placeholder="ej. Av. Reforma" />
                @if (addressForm.get('street')?.hasError('required') && addressForm.get('street')?.touched) {
                  <mat-error>La calle es requerida</mat-error>
                }
              </mat-form-field>

              <div class="row-2">
                <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                  <mat-label>Número exterior</mat-label>
                  <input matInput formControlName="ext_number" maxlength="20"
                         placeholder="ej. 123" />
                  @if (addressForm.get('ext_number')?.hasError('required') && addressForm.get('ext_number')?.touched) {
                    <mat-error>El número exterior es requerido</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                  <mat-label>Número interior</mat-label>
                  <input matInput formControlName="int_number" maxlength="20"
                         placeholder="ej. A" />
                  <mat-hint>Opcional</mat-hint>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                <mat-label>Colonia</mat-label>
                <input matInput formControlName="neighborhood" maxlength="100"
                       placeholder="ej. Centro" />
                @if (addressForm.get('neighborhood')?.hasError('required') && addressForm.get('neighborhood')?.touched) {
                  <mat-error>La colonia es requerida</mat-error>
                }
              </mat-form-field>

              <div class="row-2">
                <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                  <mat-label>Municipio / Alcaldía</mat-label>
                  <input matInput formControlName="municipality" maxlength="100"
                         placeholder="ej. Puebla" />
                  @if (addressForm.get('municipality')?.hasError('required') && addressForm.get('municipality')?.touched) {
                    <mat-error>El municipio es requerido</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                  <mat-label>Estado</mat-label>
                  <input matInput formControlName="state"
                         placeholder="ej. Puebla" />
                  @if (addressForm.get('state')?.hasError('required') && addressForm.get('state')?.touched) {
                    <mat-error>El estado es requerido</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="row-2">
                <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                  <mat-label>Código postal</mat-label>
                  <input matInput formControlName="postal_code" maxlength="5"
                         placeholder="ej. 72000" />
                  @if (addressForm.get('postal_code')?.hasError('required') && addressForm.get('postal_code')?.touched) {
                    <mat-error>El código postal es requerido</mat-error>
                  }
                  @if (addressForm.get('postal_code')?.hasError('pattern')) {
                    <mat-error>Debe ser exactamente 5 dígitos</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
                  <mat-label>País</mat-label>
                  <input matInput formControlName="country" maxlength="2"
                         placeholder="MX"
                         (input)="toUppercase($event, 'address.country')" />
                  <mat-hint>ISO 3166-1 alpha-2 (default: MX)</mat-hint>
                </mat-form-field>
              </div>

            </div>
          </mat-tab>

        </mat-tab-group>
      </div>

      <div mat-dialog-actions align="end" class="dialog-actions">
        <button type="button" mat-stroked-button mat-dialog-close>Cancelar</button>
        <button type="submit" mat-flat-button color="primary"
                [disabled]="form.invalid || saving()">
          @if (saving()) {
            <mat-spinner diameter="18" strokeWidth="2" />
          } @else {
            {{ isEdit ? 'Guardar cambios' : 'Crear proveedor' }}
          }
        </button>
      </div>
    </form>
  `,
  styles: [`
    .dialog-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 18px 24px 0;
      h2 { font-size: 1.05rem; font-weight: 700; color: #212529; margin: 0; }
    }
    .dialog-content {
      padding: 8px 0 0 !important;
      min-width: 520px;
      max-height: 70vh;
    }
    .tab-content {
      padding: 20px 24px;
      display: flex; flex-direction: column; gap: 16px;
    }
    .full-width { width: 100%; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .dialog-actions { padding: 12px 24px 18px !important; gap: 8px; }
    mat-spinner { display: inline-block; }
  `]
})
export class SupplierFormDialogComponent implements OnInit {
  private fb      = inject(FormBuilder);
  private service = inject(SuppliersService);
  dialogRef       = inject(MatDialogRef<SupplierFormDialogComponent>);
  data: SupplierFormDialogData = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  isEdit = false;

  form = this.fb.group({
    type:       new FormControl<'MORAL' | 'FISICA'>('MORAL', { nonNullable: true, validators: Validators.required }),
    rfc:        new FormControl<string | null>(null),
    legal_name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
    trade_name: new FormControl<string | null>(null, Validators.maxLength(150)),
    phone:      new FormControl<string | null>(null),
    email:      new FormControl<string | null>(null, Validators.email),
    address:    this.fb.group({
      street:       new FormControl('', { nonNullable: true, validators: Validators.required }),
      ext_number:   new FormControl('', { nonNullable: true, validators: Validators.required }),
      int_number:   new FormControl<string | null>(null),
      neighborhood: new FormControl('', { nonNullable: true, validators: Validators.required }),
      municipality: new FormControl('', { nonNullable: true, validators: Validators.required }),
      state:        new FormControl('', { nonNullable: true, validators: Validators.required }),
      postal_code:  new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[0-9]{5}$/)] }),
      country:      new FormControl('MX', { nonNullable: true }),
    }),
  });

  get addressForm(): FormGroup { return this.form.get('address') as FormGroup; }

  ngOnInit() {
    this.isEdit = this.data.supplier !== null;

    if (this.isEdit && this.data.supplier) {
      const s = this.data.supplier;
      this.form.patchValue({
        type:       s.type,
        rfc:        s.rfc,
        legal_name: s.legal_name,
        trade_name: s.trade_name,
        phone:      s.phone,
        email:      s.email,
        address: {
          street:       s.address.street,
          ext_number:   s.address.ext_number,
          int_number:   s.address.int_number,
          neighborhood: s.address.neighborhood,
          municipality: s.address.municipality,
          state:        s.address.state,
          postal_code:  s.address.postal_code,
          country:      s.address.country,
        }
      });
      // En edición, type y rfc son inmutables
      this.form.get('type')?.disable();
      this.form.get('rfc')?.disable();
    }

    this.updateRfcValidators();
  }

  onTypeChange() { this.updateRfcValidators(); }

  private updateRfcValidators() {
    const type = this.form.get('type')?.value;
    const rfcCtrl = this.form.get('rfc');
    if (!rfcCtrl) return;

    const len = type === 'MORAL' ? 12 : 13;
    rfcCtrl.setValidators([Validators.minLength(len), Validators.maxLength(len)]);
    rfcCtrl.updateValueAndValidity();
  }

  toUppercase(event: Event, controlPath: string) {
    const input = event.target as HTMLInputElement;
    const upper = input.value.toUpperCase();
    input.value = upper;
    this.form.get(controlPath)?.setValue(upper, { emitEvent: false });
  }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();

    if (this.isEdit && this.data.supplier) {
      const command = {
        legal_name:  raw.legal_name,
        trade_name:  raw.trade_name || null,
        address:     { ...raw.address, int_number: raw.address.int_number || null },
        phone:       raw.phone || null,
        email:       raw.email || null,
      };
      this.service.update(this.data.supplier.id, command).subscribe({
        next:  (r) => { this.saving.set(false); this.dialogRef.close(r); },
        error: (e) => { this.saving.set(false); this.handleError(e); }
      });
    } else {
      const command = {
        type:        raw.type,
        rfc:         raw.rfc || null,
        legal_name:  raw.legal_name,
        trade_name:  raw.trade_name || null,
        address:     { ...raw.address, int_number: raw.address.int_number || null },
        phone:       raw.phone || null,
        email:       raw.email || null,
      };
      this.service.create(command).subscribe({
        next:  (r) => { this.saving.set(false); this.dialogRef.close(r); },
        error: (e) => { this.saving.set(false); this.handleError(e); }
      });
    }
  }

  private handleError(err: any) {
    if (err.status === 409) {
      this.form.get('rfc')?.setErrors({ serverError: 'Este RFC ya está registrado.' });
      return;
    }
    if (err.status === 422 && err.error?.errors) {
      Object.entries(err.error.errors as Record<string, string[]>)
        .forEach(([field, msgs]) => {
          const path = field.replace('address.', 'address.');
          this.form.get(path)?.setErrors({ serverError: (msgs as string[])[0] });
        });
    }
  }
}
