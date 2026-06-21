import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';
import { AlertService } from '../../shared/services/alert.service';
import { InactivityService } from '../../core/auth/inactivity.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private fb         = inject(FormBuilder);
  private auth       = inject(AuthService);
  private router     = inject(Router);
  private route      = inject(ActivatedRoute);
  private alert      = inject(AlertService);
  private inactivity = inject(InactivityService);

  loading      = signal(false);
  showPassword = signal(false);
  year         = new Date().getFullYear();

  form = this.fb.group({
    email:    new FormControl('', { nonNullable: true,
                validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true,
                validators: Validators.required }),
  });

  ngOnInit() {
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'inactivity') {
      this.alert.warning(
        'Tu sesión se cerró por inactividad. Por favor inicia sesión nuevamente.'
      );
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.inactivity.start();
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 423) {
          this.alert.error('Tu cuenta está bloqueada. Contacta al administrador.');
          return;
        }
        if (err.status === 401) {
          this.alert.error('Credenciales incorrectas. Verifica tu correo y contraseña.');
          return;
        }
        this.alert.error('Error al iniciar sesión. Intenta nuevamente.');
      }
    });
  }

  togglePassword() { this.showPassword.update(v => !v); }
}
