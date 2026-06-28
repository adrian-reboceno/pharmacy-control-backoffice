import { Component, inject, signal, computed, OnInit, ChangeDetectorRef } from '@angular/core';
import {
  FormBuilder, FormControl, FormArray, FormGroup,
  ReactiveFormsModule, Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { ProductsService, ProductDTO } from './products.service';
import { AlertService } from '../../../shared/services/alert.service';
import { AuthService } from '../../../core/auth/auth.service';
import { StatusesService } from '../statuses/statuses.service';
import { CategoriesService, CategoryTreeNode } from '../categories/categories.service';
import { LaboratoriesService } from '../laboratories/laboratories.service';
import { UnitsService } from '../units/units.service';
import { PresentationsService } from '../presentations/presentations.service';
import { RoutesService } from '../routes-of-administration/routes.service';
import { LocationsService } from '../locations/locations.service';
import { ActiveIngredientsService } from '../active-ingredients/active-ingredients.service';

export interface ProductFormDialogData {
  product: ProductDTO | null;
}

interface CatalogOption { id: string; name: string; [key: string]: any; }
interface FlatCategory  { id: string; name: string; indent: string; }

interface Catalogs {
  statuses:           CatalogOption[];
  categories:         FlatCategory[];
  laboratories:       CatalogOption[];
  units:              CatalogOption[];
  concentrationUnits: CatalogOption[];
  presentations:      CatalogOption[];
  routes:             CatalogOption[];
  locations:          CatalogOption[];
  ingredients:        CatalogOption[];
}

@Component({
  selector: 'app-product-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatTabsModule, MatSlideToggleModule, MatProgressSpinnerModule,
  ],
  templateUrl: './product-form-dialog.component.html',
  styleUrl:    './product-form-dialog.component.scss',
})
export class ProductFormDialogComponent implements OnInit {
  private fb            = inject(FormBuilder);
  private service       = inject(ProductsService);
  private alert         = inject(AlertService);
  private auth          = inject(AuthService);
  private statusesSvc   = inject(StatusesService);
  private categoriesSvc = inject(CategoriesService);
  private labsSvc       = inject(LaboratoriesService);
  private unitsSvc      = inject(UnitsService);
  private presentSvc    = inject(PresentationsService);
  private routesSvc     = inject(RoutesService);
  private locationsSvc  = inject(LocationsService);
  private ingredSvc     = inject(ActiveIngredientsService);
  private cdr           = inject(ChangeDetectorRef);

  dialogRef = inject(MatDialogRef<ProductFormDialogComponent>);
  data: ProductFormDialogData = inject(MAT_DIALOG_DATA);

  saving          = signal(false);
  loadingCatalogs = signal(true);
  isEdit          = false;
  canPrice        = computed(() => this.auth.hasPermission('catalog.products.price'));

  catalogs = signal<Catalogs>({
    statuses: [], categories: [], laboratories: [],
    units: [], concentrationUnits: [], presentations: [],
    routes: [], locations: [], ingredients: [],
  });

  form = this.fb.group({
    type:              new FormControl<'GENERIC'|'BRANDED'>('GENERIC', { nonNullable: true, validators: Validators.required }),
    name:              new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
    description:       new FormControl<string|null>(null, Validators.maxLength(1000)),
    status_id:         new FormControl('', { nonNullable: true, validators: Validators.required }),
    category_id:       new FormControl('', { nonNullable: true, validators: Validators.required }),
    laboratory_id:     new FormControl<string|null>(null),
    sale_condition:    new FormControl<'SIN_RECETA'|'CON_RECETA'|'CON_RECETA_RETENIDA'>('SIN_RECETA', { nonNullable: true, validators: Validators.required }),
    sanitary_reg:      new FormControl<string|null>(null),
    barcode:           new FormControl<string|null>(null, Validators.pattern(/^\d{13}$/)),
    unit_id:           new FormControl('', { nonNullable: true, validators: Validators.required }),
    presentation_id:   new FormControl('', { nonNullable: true, validators: Validators.required }),
    route_id:          new FormControl('', { nonNullable: true, validators: Validators.required }),
    units_per_box:     new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    units_per_blister: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    location_id:       new FormControl<string|null>(null),
    min_stock:         new FormControl(0, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    max_stock:         new FormControl(100, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    expiry_alert_days: new FormControl(30, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    manage_lots:       new FormControl(false, { nonNullable: true }),
    allow_fraction:    new FormControl(false, { nonNullable: true }),
    retail_margin:     new FormControl(0, { nonNullable: true, validators: [Validators.min(0), Validators.max(100)] }),
    wholesale_margin:  new FormControl(0, { nonNullable: true, validators: [Validators.min(0), Validators.max(100)] }),
    ingredients:       this.fb.array([]),
  });

  get ingredientsArray(): FormArray { return this.form.get('ingredients') as FormArray; }

  ngOnInit() {
    this.isEdit = this.data.product !== null;
    this.loadCatalogs();
  }

  private loadCatalogs() {
    this.loadingCatalogs.set(true);
    forkJoin({
      statuses:      this.statusesSvc.getAll({ is_active: true, per_page: 100 }),
      categories:    this.categoriesSvc.getTree(true),
      laboratories:  this.labsSvc.getAll({ is_active: true, per_page: 200 }),
      units:         this.unitsSvc.getAll({ is_active: true, per_page: 100 }),
      presentations: this.presentSvc.getAll({ is_active: true, per_page: 100 }),
      routes:        this.routesSvc.getAll({ is_active: true, per_page: 100 }),
      locations:     this.locationsSvc.getAll({ level: 4, is_active: true }),
      ingredients:   this.ingredSvc.getAll({ is_active: true, per_page: 500 }),
    }).subscribe({
      next: (res) => {
        const allUnits = res.units.data;
        this.catalogs.set({
          statuses:           res.statuses.data,
          categories:         this.flattenCategories(res.categories),
          laboratories:       res.laboratories.data,
          units:              allUnits,
          concentrationUnits: allUnits.filter((u: any) => u.type === 'CONCENTRATION'),
          presentations:      res.presentations.data,
          routes:             res.routes.data,
          locations:          res.locations,
          ingredients:        res.ingredients.data,
        });
        this.loadingCatalogs.set(false);
        if (this.isEdit && this.data.product) {
          this.patchForm(this.data.product);
        }
      },
      error: () => {
        this.loadingCatalogs.set(false);
        this.alert.error('No se pudieron cargar los catálogos del formulario.');
      }
    });
  }

  private flattenCategories(nodes: CategoryTreeNode[], depth = 0): FlatCategory[] {
    const result: FlatCategory[] = [];
    for (const node of nodes) {
      result.push({ id: node.id, name: node.name, indent: '—'.repeat(depth) + (depth > 0 ? ' ' : '') });
      if (node.children?.length) result.push(...this.flattenCategories(node.children, depth + 1));
    }
    return result;
  }

  private patchForm(p: ProductDTO) {   
    this.form.patchValue({
      type: p.type, name: p.name, description: p.description,
      status_id: p.status_id, category_id: p.category_id,
      laboratory_id: p.laboratory_id, sale_condition: p.sale_condition,
      sanitary_reg: p.specs.sanitary_reg, barcode: p.specs.barcode,
      unit_id: p.specs.unit_id, presentation_id: p.specs.presentation_id,
      route_id: p.specs.route_id,
      units_per_box: p.specs.units_per_box, units_per_blister: p.specs.units_per_blister,
      location_id: p.specs.location_id,
      min_stock: p.stock_config.min_stock, max_stock: p.stock_config.max_stock,
      expiry_alert_days: p.stock_config.expiry_alert_days,
      manage_lots: p.stock_config.manage_lots, allow_fraction: p.stock_config.allow_fraction,
      retail_margin: p.margins.retail_margin, wholesale_margin: p.margins.wholesale_margin,
    });
    this.ingredientsArray.clear();
    p.ingredients.forEach(i =>
      this.addIngredient(i.ingredient_id, String(i.concentration), i.concentration_unit)
    );
    this.cdr.detectChanges();
  }

  addIngredient(ingredientId = '', concentration = '', concentrationUnit = '') {
    this.ingredientsArray.push(this.fb.group({
      ingredient_id:      new FormControl(ingredientId,      { nonNullable: true, validators: Validators.required }),
      concentration:      new FormControl(concentration,     { nonNullable: true, validators: Validators.required }),
      concentration_unit: new FormControl(concentrationUnit, { nonNullable: true, validators: Validators.required }),
    }));
  }

  removeIngredient(index: number) { this.ingredientsArray.removeAt(index); }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.getRawValue();

    const command = {
      type: raw.type, name: raw.name,
      description: raw.description || null,
      status_id: raw.status_id, category_id: raw.category_id,
      laboratory_id: raw.laboratory_id || null,
      sale_condition: raw.sale_condition,
      sanitary_reg: raw.sanitary_reg || null,
      barcode: raw.barcode || null,
      unit_id: raw.unit_id, presentation_id: raw.presentation_id, route_id: raw.route_id,
      units_per_box: raw.units_per_box, units_per_blister: raw.units_per_blister,
      location_id: raw.location_id || null,
      min_stock: raw.min_stock, max_stock: raw.max_stock,
      expiry_alert_days: raw.expiry_alert_days,
      manage_lots: raw.manage_lots, allow_fraction: raw.allow_fraction,
      retail_margin: raw.retail_margin, wholesale_margin: raw.wholesale_margin,
      ingredients: (raw.ingredients as any[]) as import('./products.service').ProductIngredientCommand[],
    };

    const request = this.isEdit && this.data.product
      ? this.service.update(this.data.product.id, command)
      : this.service.create(command);

    request.subscribe({
      next:  (r) => { this.saving.set(false); this.dialogRef.close(r); },
      error: (err) => {
        this.saving.set(false);
        if (err.status === 409) {
          const msg = (err.error?.message ?? '').toLowerCase();
          if (msg.includes('barcode') || msg.includes('código')) {
            this.form.get('barcode')?.setErrors({ serverError: 'Este código de barras ya está registrado.' });
          } else {
            this.form.get('name')?.setErrors({ serverError: 'Este nombre ya está registrado.' });
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
