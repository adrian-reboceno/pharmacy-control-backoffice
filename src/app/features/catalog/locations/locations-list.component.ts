import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { LocationsService, LocationDTO } from './locations.service';
import { AlertService } from '../../../shared/services/alert.service';
import { LocationFormDialogComponent } from './location-form-dialog.component';

interface FlatRow { node: LocationDTO; }

@Component({
  selector: 'app-locations-list',
  standalone: true,
  imports: [SlicePipe, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './locations-list.component.html',
  styleUrl: './locations-list.component.scss',
})
export class LocationsListComponent implements OnInit {
  private service = inject(LocationsService);
  private alert   = inject(AlertService);
  private dialog  = inject(MatDialog);

  tree         = signal<LocationDTO[]>([]);
  loading      = signal(false);
  filterActive = signal<boolean | undefined>(undefined);
  expandedIds  = signal<Set<string>>(new Set());

  flatRows = computed<FlatRow[]>(() => {
    const rows: FlatRow[] = [];
    const expanded = this.expandedIds();
    const walk = (nodes: LocationDTO[]) => {
      for (const node of nodes) {
        rows.push({ node });
        if (node.children?.length && expanded.has(node.id)) {
          walk(node.children);
        }
      }
    };
    walk(this.tree());
    return rows;
  });

  ngOnInit() { this.loadTree(); }

  loadTree() {
    this.loading.set(true);
    this.service.getTree(this.filterActive()).subscribe({
      next: (data) => {
        this.tree.set(data);
        this.loading.set(false);
        const ids = new Set(data.map(n => n.id));
        this.expandedIds.set(ids);
      },
      error: () => {
        this.loading.set(false);
        this.alert.error('No se pudieron cargar las ubicaciones.');
      }
    });
  }

  setActive(value: boolean | undefined) {
    this.filterActive.set(value);
    this.loadTree();
  }

  isExpanded(id: string): boolean { return this.expandedIds().has(id); }

  toggleExpand(id: string) {
    const set = new Set(this.expandedIds());
    set.has(id) ? set.delete(id) : set.add(id);
    this.expandedIds.set(set);
  }

  hasChildren(node: LocationDTO): boolean {
    return (node.children?.length ?? 0) > 0;
  }

  levelIcon(level: number): string {
    return { 1: 'map', 2: 'view_week', 3: 'view_agenda', 4: 'place' }[level] ?? 'place';
  }

  childLabel(level: number): string {
    return { 1: 'pasillo', 2: 'estante', 3: 'posición' }[level] ?? 'ubicación';
  }

  private flattenTree(nodes: LocationDTO[]): LocationDTO[] {
    const result: LocationDTO[] = [];
    const walk = (items: LocationDTO[]) => {
      for (const n of items) {
        result.push(n);
        if (n.children?.length) walk(n.children);
      }
    };
    walk(nodes);
    return result;
  }

  async openCreate(parentId: string | null, parentLevel: number | null) {
    const allNodes = this.flattenTree(this.tree());
    const ref = this.dialog.open(LocationFormDialogComponent, {
      data: { location: null, parentId, parentLevel, allNodes },
      width: '480px', maxWidth: '90vw', autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      this.alert.toast('Ubicación creada correctamente.', 'success');
      this.loadTree();
    }
  }

  async openEdit(location: LocationDTO) {
    const allNodes = this.flattenTree(this.tree());
    const ref = this.dialog.open(LocationFormDialogComponent, {
      data: { location, parentId: null, parentLevel: null, allNodes },
      width: '480px', maxWidth: '90vw', autoFocus: 'first-tabbable',
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      this.alert.toast('Ubicación actualizada correctamente.', 'success');
      this.loadTree();
    }
  }

  async deactivate(location: LocationDTO) {
    const confirmed = await this.alert.confirmDelete(location.name);
    if (!confirmed) return;
    this.service.deactivate(location.id).subscribe({
      next:  () => { this.alert.toast('Ubicación desactivada.', 'success'); this.loadTree(); },
      error: () => { this.alert.error('No se pudo desactivar la ubicación.'); }
    });
  }
}
