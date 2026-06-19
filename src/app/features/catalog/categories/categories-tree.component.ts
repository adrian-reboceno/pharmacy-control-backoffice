import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CategoriesService, CategoryTreeNode, CategoryDTO } from './categories.service';
import { AlertService } from '../../../shared/services/alert.service';
import { CategoryFormDialogService } from './category-form-dialog.service';

interface FlatRow {
  node:  CategoryTreeNode;
  depth: number;
}

@Component({
  selector: 'app-categories-tree',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './categories-tree.component.html',
  styleUrl: './categories-tree.component.scss',
})
export class CategoriesTreeComponent implements OnInit {
  private categoriesService = inject(CategoriesService);
  private alert             = inject(AlertService);
  private formDialog        = inject(CategoryFormDialogService);

  tree         = signal<CategoryTreeNode[]>([]);
  loading      = signal(false);
  filterActive = signal<boolean | undefined>(undefined);
  expandedIds  = signal<Set<string>>(new Set());

  /**
   * Aplana el árbol a una lista de filas { node, depth } respetando
   * qué ramas están expandidas. Es la fuente de datos de la tabla.
   */
  flatRows = computed<FlatRow[]>(() => {
    const rows: FlatRow[] = [];
    const expanded = this.expandedIds();

    const walk = (nodes: CategoryTreeNode[], depth: number) => {
      for (const node of nodes) {
        rows.push({ node, depth });
        if (node.children?.length && expanded.has(node.id)) {
          walk(node.children, depth + 1);
        }
      }
    };

    walk(this.tree(), 0);
    return rows;
  });

  ngOnInit() {
    this.loadTree();
  }

  loadTree() {
    this.loading.set(true);
    this.categoriesService.getTree(this.filterActive()).subscribe({
      next: (data) => {
        this.tree.set(data);
        this.loading.set(false);
        const ids = new Set(data.map(n => n.id));
        this.expandedIds.set(ids);
      },
      error: () => {
        this.loading.set(false);
        this.alert.error('No se pudo cargar la lista de categorías.');
      }
    });
  }

  setFilter(value: boolean | undefined) {
    this.filterActive.set(value);
    this.loadTree();
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  toggleExpand(id: string) {
    const set = new Set(this.expandedIds());
    set.has(id) ? set.delete(id) : set.add(id);
    this.expandedIds.set(set);
  }

  async openCreateDialog(parentId: string | null) {
    const result = await this.formDialog.openCreate(parentId);
    if (result) this.loadTree();
  }

  async openEditDialog(node: CategoryDTO) {
    const result = await this.formDialog.openEdit(node);
    if (result) this.loadTree();
  }

  async deactivate(node: CategoryTreeNode) {
    const confirmed = await this.alert.confirmDelete(node.name);
    if (!confirmed) return;

    this.categoriesService.deactivate(node.id).subscribe({
      next: () => {
        this.alert.toast('Categoría desactivada correctamente.', 'success');
        this.loadTree();
      },
      error: () => {
        this.alert.error('No se pudo desactivar la categoría.');
      }
    });
  }
}
