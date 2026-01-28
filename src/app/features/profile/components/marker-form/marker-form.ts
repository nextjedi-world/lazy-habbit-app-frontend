import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  input,
  output,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProgressMarkerService } from '../../../../core/services/progress-marker';
import { UserService } from '../../../../core/services/user';
import { CreateMarkerDto, ProgressMarker } from '../../../../core/models/marker.model';

interface MarkerFormData {
  name: FormControl<string>;
  unit: FormControl<string>;
  category_id: FormControl<number | null>;
}

@Component({
  selector: 'app-marker-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './marker-form.html',
  styleUrl: './marker-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkerForm {
  private readonly markerService = inject(ProgressMarkerService);
  private readonly userService = inject(UserService);

  // Inputs
  marker = input<ProgressMarker | null>(null); // For edit mode

  // Outputs
  formSubmit = output<ProgressMarker>();
  formCancel = output<void>();

  // State
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);

  // Categories from user service
  categories = this.userService.categories;

  // Form definition
  form = new FormGroup<MarkerFormData>({
    name: new FormControl('', {
      validators: [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100),
      ],
      nonNullable: true,
    }),
    unit: new FormControl('', {
      validators: [Validators.maxLength(20)],
      nonNullable: true,
    }),
    category_id: new FormControl<number | null>(null),
  });

  // Computed properties
  get isEditMode(): boolean {
    return this.marker() !== null;
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Update Marker' : 'Create Marker';
  }

  get formTitle(): string {
    return this.isEditMode ? 'Edit Progress Marker' : 'New Progress Marker';
  }

  // Form field error getters
  get nameErrors(): string | null {
    const control = this.form.controls.name;
    if (control.hasError('required')) return 'Marker name is required';
    if (control.hasError('minlength'))
      return 'Name must be at least 2 characters';
    if (control.hasError('maxlength'))
      return 'Name must not exceed 100 characters';
    return null;
  }

  get unitErrors(): string | null {
    const control = this.form.controls.unit;
    if (control.hasError('maxlength'))
      return 'Unit must not exceed 20 characters';
    return null;
  }

  constructor() {
    // Populate form if editing
    effect(() => {
      const markerData = this.marker();
      if (markerData) {
        this.form.patchValue({
          name: markerData.name,
          unit: markerData.unit || '',
          category_id: markerData.category_id,
        });
      }
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    try {
      const formValue = this.form.getRawValue();
      const dto: CreateMarkerDto = {
        name: formValue.name,
        unit: formValue.unit || undefined,
        category_id: formValue.category_id || undefined,
      };

      let result: ProgressMarker;

      if (this.isEditMode) {
        // Update existing marker
        result = await this.markerService.updateMarker(this.marker()!.id, dto);
      } else {
        // Create new marker
        result = await this.markerService.createMarker(dto);
      }

      this.formSubmit.emit(result);
      this.form.reset();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save marker';
      this.submitError.set(errorMessage);
      console.error('Error submitting marker form:', err);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onCancel(): void {
    this.formCancel.emit();
    this.form.reset();
    this.submitError.set(null);
  }

  clearError(): void {
    this.submitError.set(null);
  }
}
