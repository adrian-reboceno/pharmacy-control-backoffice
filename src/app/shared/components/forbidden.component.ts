import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule],
  template: `
    <div class="forbidden-page">
      <mat-icon class="forbidden-icon">block</mat-icon>
      <h1>Acceso restringido</h1>
      <p>No tienes permiso para ver esta sección.</p>
      <a mat-flat-button color="primary" routerLink="/dashboard">Volver al dashboard</a>
    </div>
  `,
  styles: [`
    .forbidden-page {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 70vh; gap: 12px; text-align: center;
    }
    .forbidden-icon { font-size: 64px; width: 64px; height: 64px; color: #f06548; }
    h1 { font-size: 1.3rem; color: #212529; margin: 0; }
    p { color: #6c757d; margin: 0 0 12px; }
  `]
})
export class ForbiddenComponent {}
