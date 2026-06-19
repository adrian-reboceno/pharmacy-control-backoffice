import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';
import { AlertService } from '../../shared/services/alert.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private alert  = inject(AlertService);

  loading      = signal(false);
  showPassword = signal(false);
  year         = new Date().getFullYear();

  form = this.fb.group({
    email:    new FormControl('', { nonNullable: true,
                validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true,
                validators: Validators.required }),
  });

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);

    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        const name = this.auth.currentUser()?.name ?? 'de nuevo';
        this.router.navigate(['/dashboard']).then(() => {
          this.alert.toast(`¡Bienvenido, ${name}!`, 'success');
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.alert.error(
          err.status === 401
            ? 'Las credenciales ingresadas son incorrectas. Verifica tu correo y contraseña.'
            : 'No se pudo conectar con el servidor. Intenta de nuevo.',
          err.status === 401 ? 'Credenciales incorrectas' : 'Error de conexión'
        );
      }
    });
  }
}
