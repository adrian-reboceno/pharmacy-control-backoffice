import {
  Component, input, output, signal, computed,
  ContentChild, TemplateRef
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface DataTableColumn {
  key:       string;
  label:     string;
  sortable?: boolean;
  template?: TemplateRef<any>;
}

export interface DataTablePageEvent {
  page:     number;
  pageSize: number;
  search:   string;
  sortKey:  string;
  sortDir:  'asc' | 'desc';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [NgTemplateOutlet, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent {
  /* ── Inputs ─────────────────────────────────── */
  columns   = input.required<DataTableColumn[]>();
  rows      = input<any[]>([]);
  total     = input<number>(0);
  loading   = input<boolean>(false);
  hasActions = input<boolean>(true);
  trackByKey = input<string>('id');
  showSearch = input<boolean>(true);

  @ContentChild('actionsTemplate') actionsTemplate?: TemplateRef<any>;

  /* ── Outputs ────────────────────────────────── */
  pageChange     = output<DataTablePageEvent>();
  selectionChange = output<any[]>();

  /* ── Internal state ─────────────────────────── */
  page     = signal(1);
  pageSize = signal(10);
  search   = signal('');
  sortKey  = signal('');
  sortDir  = signal<'asc' | 'desc'>('asc');
  selectedIds = signal<Set<string>>(new Set());

  /* ── Computed ───────────────────────────────── */
  lastPage = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  from     = computed(() => Math.min((this.page() - 1) * this.pageSize() + 1, this.total()));
  to       = computed(() => Math.min(this.page() * this.pageSize(), this.total()));

  allSelected = computed(() => {
    const ids = this.selectedIds();
    return this.rows().length > 0 && this.rows().every(r => ids.has(r[this.trackByKey()]));
  });

  someSelected = computed(() => {
    const ids = this.selectedIds();
    return this.rows().some(r => ids.has(r[this.trackByKey()])) && !this.allSelected();
  });

  pageNumbers = computed(() => {
    const last = this.lastPage();
    const cur  = this.page();
    if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

    const pages: number[] = [1];
    if (cur > 3) pages.push(-1);
    for (let i = Math.max(2, cur - 1); i <= Math.min(last - 1, cur + 1); i++) pages.push(i);
    if (cur < last - 2) pages.push(-1);
    pages.push(last);
    return pages;
  });

  /* ── Public methods ─────────────────────────── */
  trackBy(row: any): string { return row[this.trackByKey()]; }

  getCellValue(row: any, key: string): any {
    return key.split('.').reduce((obj, k) => obj?.[k], row);
  }

  isSelected(row: any): boolean {
    return this.selectedIds().has(row[this.trackByKey()]);
  }

  toggleSelect(row: any, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const set = new Set(this.selectedIds());
    checked ? set.add(row[this.trackByKey()]) : set.delete(row[this.trackByKey()]);
    this.selectedIds.set(set);
    this.selectionChange.emit(this.rows().filter(r => set.has(r[this.trackByKey()])));
  }

  toggleSelectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const set = new Set(this.selectedIds());
    this.rows().forEach(r => checked ? set.add(r[this.trackByKey()]) : set.delete(r[this.trackByKey()]));
    this.selectedIds.set(set);
    this.selectionChange.emit(checked ? [...this.rows()] : []);
  }

  onPageSizeChange(event: Event) {
    this.pageSize.set(Number((event.target as HTMLSelectElement).value));
    this.page.set(1);
    this.selectedIds.set(new Set());
    this.emit();
  }

  onSearchChange(event: Event) {
    this.search.set((event.target as HTMLInputElement).value);
    this.page.set(1);
    this.selectedIds.set(new Set());
    this.emit();
  }

  clearSearch() {
    this.search.set('');
    this.page.set(1);
    this.emit();
  }

  onSort(key: string) {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
    this.page.set(1);
    this.emit();
  }

  goToPage(p: number) {
    if (p < 1 || p > this.lastPage()) return;
    this.page.set(p);
    this.selectedIds.set(new Set());
    this.emit();
  }

  /** Emite el evento con el estado actual de paginación/búsqueda/orden. */
  emit() {
    this.pageChange.emit({
      page:     this.page(),
      pageSize: this.pageSize(),
      search:   this.search(),
      sortKey:  this.sortKey(),
      sortDir:  this.sortDir(),
    });
  }

  /** Reset externo — llamar cuando se recarga desde el padre. */
  reset() {
    this.page.set(1);
    this.search.set('');
    this.sortKey.set('');
    this.sortDir.set('asc');
    this.selectedIds.set(new Set());
  }
}
