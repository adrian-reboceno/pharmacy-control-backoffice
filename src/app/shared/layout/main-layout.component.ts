import { Component, inject, computed } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../core/auth/auth.service';

interface NavChild {
  label:      string;
  icon:       string;
  route:      string;
  permission?: string;
}

interface NavItem {
  label:      string;
  icon:       string;
  route?:     string;
  permission?: string;
  children?:  NavChild[];
}

/**
 * El permiso de cada item/hijo debe coincidir EXACTAMENTE con el string
 * devuelto por /auth/me. Un item sin `permission` es siempre visible.
 * Un item con `children` solo se muestra si al menos uno de sus hijos
 * es visible (ver `visibleItems`).
 */
const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: 'space_dashboard', route: '/dashboard' },

  {
    label: 'Catálogo', icon: 'category',
    children: [
      { label: 'Categorías',          icon: 'account_tree',  route: '/catalog/categories',               permission: 'catalog.categories.manage' },
      { label: 'Unidades de medida',  icon: 'straighten',    route: '/catalog/units',                    permission: 'catalog.units.manage' },
      { label: 'Presentaciones',      icon: 'medication',    route: '/catalog/presentations',            permission: 'catalog.presentations.manage' },
      { label: 'Vías de adm.',        icon: 'route',         route: '/catalog/routes-of-administration', permission: 'catalog.routes-of-administration.manage' },
      { label: 'Estados',             icon: 'toggle_on',     route: '/catalog/status',                   permission: 'catalog.statuses.manage' },
      { label: 'Clasificaciones',     icon: 'label',         route: '/catalog/classifications',          permission: 'catalog.classifications.manage' },
      { label: 'Laboratorios',        icon: 'science',       route: '/catalog/laboratories',             permission: 'catalog.laboratories.manage' },
      { label: 'Ingredientes activos',icon: 'biotech',       route: '/catalog/active-ingredients',       permission: 'catalog.active-ingredients.manage' },
      { label: 'Productos',           icon: 'medication_liquid', route: '/catalog/products',             permission: 'catalog.products.view' },
      { label: 'Proveedores',         icon: 'local_shipping',route: '/catalog/suppliers',                permission: 'catalog.suppliers.manage' },
    ],
  },

  {
    label: 'Inventario', icon: 'inventory_2',
    children: [
      { label: 'Lotes',         icon: 'inventory',     route: '/inventory/batches',  permission: 'inventory.batch.view' },
      { label: 'Reportes',      icon: 'bar_chart',     route: '/inventory/reports',  permission: 'inventory.reports.view' },
      { label: 'Alertas',       icon: 'notifications_active', route: '/inventory/alerts', permission: 'inventory.alerts.view' },
    ],
  },

  {
    label: 'Ventas', icon: 'point_of_sale',
    children: [
      { label: 'Punto de venta', icon: 'storefront',   route: '/sales/pos',      permission: 'sales.pos.operate' },
      { label: 'Reportes',       icon: 'bar_chart',    route: '/sales/reports',  permission: 'sales.reports.view' },
      { label: 'Recetas',        icon: 'description',  route: '/sales/prescriptions', permission: 'prescriptions.reports.view' },
    ],
  },

  {
    label: 'Compras', icon: 'shopping_cart',
    children: [
      { label: 'Órdenes de compra', icon: 'request_quote', route: '/purchasing/orders',    permission: 'purchasing.order.view' },
      { label: 'Proveedores',       icon: 'local_shipping', route: '/purchasing/suppliers', permission: 'purchasing.suppliers.manage' },
    ],
  },

  {
    label: 'Clientes', icon: 'group',
    children: [
      { label: 'Historial', icon: 'history', route: '/customers/history', permission: 'customers.history.view' },
    ],
  },

  {
    label: 'Facturación', icon: 'receipt_long',
    children: [
      { label: 'CFDI', icon: 'description', route: '/billing/cfdi', permission: 'billing.cfdi.view' },
    ],
  },

  {
    label: 'Reportes', icon: 'analytics',
    children: [
      { label: 'Dashboard',        icon: 'dashboard',     route: '/reports/dashboard', permission: 'reports.dashboard.view' },
      { label: 'Ventas',           icon: 'point_of_sale', route: '/reports/sales',     permission: 'reports.sales.export' },
      { label: 'Inventario',       icon: 'inventory_2',   route: '/reports/inventory', permission: 'reports.inventory.export' },
      { label: 'COFEPRIS',         icon: 'gavel',         route: '/reports/cofepris',  permission: 'reports.cofepris.export' },
    ],
  },

  {
    label: 'Administración', icon: 'admin_panel_settings',
    children: [
      { label: 'Usuarios',     icon: 'person',          route: '/auth/users',    permission: 'auth.users.view' },
      { label: 'Roles',        icon: 'badge',            route: '/auth/roles',    permission: 'auth.roles.view' },
      { label: 'Sesiones',     icon: 'devices',          route: '/auth/sessions', permission: 'auth.sessions.view' },
      { label: 'Auditoría',    icon: 'history_edu',      route: '/auth/audit',    permission: 'auth.audit.view' },
    ],
  },

  {
    label: 'Configuración', icon: 'settings',
    children: [
      { label: 'Sistema',       icon: 'tune',         route: '/config/system',       permission: 'config.system.view' },
      { label: 'Integraciones', icon: 'extension',     route: '/config/integrations', permission: 'config.integrations.manage' },
    ],
  },
];

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatIconModule, MatButtonModule, MatMenuModule,
    MatDividerModule, MatTooltipModule, MatBadgeModule,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  auth   = inject(AuthService);
  router = inject(Router);

  userInitial = computed(() => {
    const user = this.auth.currentUser();
    if (!user) return '?';
    const name = user.name || user.email || '';
    return name.charAt(0).toUpperCase();
  });

  /**
   * Un item simple (sin children) se muestra si:
   *   - no tiene `permission` definido, o
   *   - el usuario tiene ese permiso.
   * Un item con `children` se muestra solo si al menos un hijo es visible,
   * evitando menús "Catálogo ▾" vacíos para roles sin esos permisos.
   */
  visibleItems = computed(() =>
    NAV_ITEMS.filter(item => {
      if (item.children) {
        return this.visibleChildren(item).length > 0;
      }
      return !item.permission || this.auth.hasPermission(item.permission);
    })
  );

  visibleChildren(item: NavItem): NavChild[] {
    return (item.children ?? []).filter(c =>
      !c.permission || this.auth.hasPermission(c.permission)
    );
  }

  logout() { this.auth.logout(); }
}
