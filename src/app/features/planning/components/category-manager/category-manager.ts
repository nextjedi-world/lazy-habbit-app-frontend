import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Category } from '../../../../core/models/user.model';
import { UserService } from '../../../../core/services/user';
import {
  CATEGORY_PRESETS,
  CategoryPreset,
} from '../../../../shared/constants/category-presets';

@Component({
  selector: 'app-category-manager',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-manager.html',
  styleUrl: './category-manager.scss',
})
export class CategoryManager {
  // Inputs
  categories = input.required<Category[]>();
  userId = input.required<string>();

  // Outputs
  categoriesChanged = output<void>();

  // Services
  private readonly userService = inject(UserService);
  private readonly snackBar = inject(MatSnackBar);

  // State
  isCreating = signal(false);
  isEditing = signal<number | null>(null);
  availablePresets = signal<CategoryPreset[]>(CATEGORY_PRESETS);

  // Form
  categoryForm = new FormGroup({
    name: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
      ],
      nonNullable: true,
    }),
    preset_id: new FormControl<string>('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  /**
   * Start creating new category
   */
  startCreate(): void {
    this.isCreating.set(true);
    this.categoryForm.reset({
      name: '',
      preset_id: 'health-red', // Default preset
    });
  }

  /**
   * Cancel create/edit
   */
  cancel(): void {
    this.isCreating.set(false);
    this.isEditing.set(null);
    this.categoryForm.reset();
  }

  /**
   * Save new category
   */
  async saveNew(): Promise<void> {
    if (!this.categoryForm.valid) return;

    try {
      const { name, preset_id } = this.categoryForm.getRawValue();
      await this.userService.createCategory(this.userId(), name, preset_id);

      this.snackBar.open('Category created successfully', 'Close', {
        duration: 3000,
      });
      this.cancel();
      this.categoriesChanged.emit();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create category';
      this.snackBar.open(message, 'Close', { duration: 5000 });
    }
  }

  /**
   * Start editing category
   */
  startEdit(category: Category): void {
    this.isEditing.set(category.id);
    this.categoryForm.patchValue({
      name: category.name,
      preset_id: category.preset_id || 'health-red',
    });
  }

  /**
   * Save category edit
   */
  async saveEdit(categoryId: number): Promise<void> {
    if (!this.categoryForm.valid) return;

    try {
      const updates = this.categoryForm.getRawValue();
      await this.userService.updateCategory(categoryId, updates);

      this.snackBar.open('Category updated successfully', 'Close', {
        duration: 3000,
      });
      this.cancel();
      this.categoriesChanged.emit();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to update category';
      this.snackBar.open(message, 'Close', { duration: 5000 });
    }
  }

  /**
   * Delete category (with confirmation)
   */
  async deleteCategory(category: Category): Promise<void> {
    const confirmed = confirm(
      `Delete "${category.name}"?\n\nAll tasks in this category will be moved to "Uncategorized".`
    );

    if (!confirmed) return;

    try {
      await this.userService.deleteCategory(this.userId(), category.id);

      this.snackBar.open('Category deleted', 'Close', { duration: 3000 });
      this.categoriesChanged.emit();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete category';
      this.snackBar.open(message, 'Close', { duration: 5000 });
    }
  }

  /**
   * Get preset details for a category
   */
  getPreset(category: Category): CategoryPreset | undefined {
    return this.availablePresets().find(p => p.id === category.preset_id);
  }

  /**
   * Get form errors
   */
  get nameError(): string | null {
    const control = this.categoryForm.controls.name;
    if (control.hasError('required')) return 'Category name is required';
    if (control.hasError('minlength'))
      return 'Name must be at least 2 characters';
    if (control.hasError('maxlength'))
      return 'Name must be at most 50 characters';
    return null;
  }
}
