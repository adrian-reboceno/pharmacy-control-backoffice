import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { AuthService } from '../../core/auth/auth.service';

interface StatCard {
  label:    string;
  value:    string;
  icon:     string;
  color:    string;
  bg:       string;
  trend:    string;
  positive: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIconModule, MatRippleModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  auth = inject(AuthService);

  stats: StatCard[] = [
    { label: 'Productos activos',  value: '—', icon: 'medication_liquid', color: '#405189', bg: '#eef0fa', trend: 'Módulo próximo', positive: true },
    { label: 'Proveedores',        value: '—', icon: 'local_shipping',    color: '#0ab39c', bg: '#d1f2eb', trend: 'Módulo próximo', positive: true },
    { label: 'Órdenes de compra',  value: '—', icon: 'shopping_cart',     color: '#f7b731', bg: '#fef9e7', trend: 'Módulo próximo', positive: true },
    { label: 'Alertas de stock',   value: '—', icon: 'warning_amber',     color: '#f06548', bg: '#fde8e4', trend: 'Módulo próximo', positive: false },
  ];

  modules = [
    { label: 'Catálogo',        icon: 'category',          color: '#405189', bg: '#eef0fa', desc: 'Categorías, unidades, presentaciones', ready: false },
    { label: 'Proveedores',     icon: 'local_shipping',    color: '#0ab39c', bg: '#d1f2eb', desc: 'Gestión de proveedores y contactos',   ready: false },
    { label: 'Productos',       icon: 'medication_liquid', color: '#f7b731', bg: '#fef9e7', desc: 'Medicamentos e ingredientes activos',   ready: false },
    { label: 'Inventario',      icon: 'inventory_2',       color: '#299cdb', bg: '#e3f4fc', desc: 'Stock, lotes y movimientos',            ready: false },
    { label: 'Compras',         icon: 'shopping_cart',     color: '#f06548', bg: '#fde8e4', desc: 'Órdenes de compra y recepciones',       ready: false },
    { label: 'Configuración',   icon: 'settings',          color: '#6c757d', bg: '#f3f6f9', desc: 'Roles, permisos y usuarios',            ready: false },
  ];
}
