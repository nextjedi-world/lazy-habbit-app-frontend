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
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProgressMarkerService } from '../../../../core/services/progress-marker';
import {
  MarkerEntry,
  MarkerWithLatestEntry,
  CreateEntryDto,
} from '../../../../core/models/marker.model';

interface EntryFormData {
  value: FormControl<number>;
  entry_date: FormControl<Date>;
  notes: FormControl<string>;
}

@Component({
  selector: 'app-marker-entry-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './marker-entry-form.html',
  styleUrl: './marker-entry-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkerEntryForm {
  private readonly markerService = inject(ProgressMarkerService);

  // Inputs
  marker = input.required<MarkerWithLatestEntry>();
  entry = input<MarkerEntry | null>(null); // For edit mode
  quickMode = input(false); // Simplified UI for Sunday review

  // Outputs
  formSubmit = output<MarkerEntry>();
  formCancel = output<void>();

  // State
  isSubmitting = signal(false);
  submitError = signal<string | null>(null);

  // Max date (today) - no future entries
  maxDate = new Date();

  // Form definition
  form = new FormGroup<EntryFormData>({
    value: new FormControl(0, {
      validators: [Validators.required],
      nonNullable: true,
    }),
    entry_date: new FormControl(new Date(), {
      validators: [Validators.required],
      nonNullable: true,
    }),
    notes: new FormControl('', {
      validators: [Validators.maxLength(500)],
      nonNullable: true,
    }),
  });

  // Computed properties
  get isEditMode(): boolean {
    return this.entry() !== null;
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Update Entry' : 'Log Entry';
  }

  get formTitle(): string {
    const markerName = this.marker().name;
    return this.isEditMode
      ? `Edit ${markerName} Entry`
      : `Log ${markerName}`;
  }

  get markerUnit(): string | null {
    return this.marker().unit;
  }

  // Form field error getters
  get valueErrors(): string | null {
    const control = this.form.controls.value;
    if (control.hasError('required')) return 'Value is required';
    return null;
  }

  get dateErrors(): string | null {
    const control = this.form.controls.entry_date;
    if (control.hasError('required')) return 'Date is required';
    if (control.hasError('matDatepickerMax'))
      return 'Future dates are not allowed';
    return null;
  }

  get notesErrors(): string | null {
    const control = this.form.controls.notes;
    if (control.hasError('maxlength'))
      return 'Notes must not exceed 500 characters';
    return null;
  }

  constructor() {
    // Populate form if editing
    effect(() => {
      const entryData = this.entry();
      if (entryData) {
        this.form.patchValue({
          value: entryData.value,
          entry_date: new Date(entryData.entry_date),
          notes: entryData.notes || '',
        });
      }
    });

    // Pre-fill with latest entry value if available (convenience)
    effect(() => {
      if (!this.isEditMode && this.marker().latest_entry) {
        const latestValue = this.marker().latest_entry!.value;
        this.form.patchValue({ value: latestValue });
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

      // Convert Date to ISO date string (YYYY-MM-DD)
      const entryDate = formValue.entry_date.toISOString().split('T')[0];

      let result: MarkerEntry;

      if (this.isEditMode) {
        // Update existing entry
        result = await this.markerService.updateEntry(this.entry()!.id, {
          value: formValue.value,
          notes: formValue.notes || undefined,
        });
      } else {
        // Create new entry
        const dto: CreateEntryDto = {
          marker_id: this.marker().id,
          value: formValue.value,
          entry_date: entryDate,
          notes: formValue.notes || undefined,
        };
        result = await this.markerService.addEntry(dto);
      }

      this.formSubmit.emit(result);
      this.form.reset({
        value: 0,
        entry_date: new Date(),
        notes: '',
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to save entry';
      this.submitError.set(errorMessage);
      console.error('Error submitting entry form:', err);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onCancel(): void {
    this.formCancel.emit();
    this.form.reset({
      value: 0,
      entry_date: new Date(),
      notes: '',
    });
    this.submitError.set(null);
  }

  clearError(): void {
    this.submitError.set(null);
  }
}
