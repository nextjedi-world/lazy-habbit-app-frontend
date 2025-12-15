import { Component, input, output, effect, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Category } from '../../../../core/models/user.model';

export interface TaskFormData {
  name: string;
  category_id: number;
  duration_minutes: number;
  target_frequency: number;
}

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './task-form.html',
  styleUrl: './task-form.scss',
})
export class TaskFormComponent {
  // Inputs
  task = input<TaskFormData | null>(null);
  categories = input.required<Category[]>();
  taskIndex = input.required<number>();

  // Outputs
  taskChange = output<TaskFormData>();
  removeTask = output<void>();

  // Form
  taskForm = new FormGroup({
    name: new FormControl('', {
      validators: [Validators.required, Validators.minLength(2)],
      nonNullable: true,
    }),
    category_id: new FormControl<number | null>(null, {
      validators: [Validators.required],
    }),
    duration_minutes: new FormControl(30, {
      validators: [Validators.required, Validators.min(5), Validators.max(480)],
      nonNullable: true,
    }),
    target_frequency: new FormControl(1, {
      validators: [Validators.required, Validators.min(1), Validators.max(7)],
      nonNullable: true,
    }),
  });

  constructor() {
    // Initialize form with task data if provided
    effect(() => {
      const taskData = this.task();
      if (taskData) {
        this.taskForm.patchValue(taskData, { emitEvent: false });
      }
    });

    // Emit changes on value change
    this.taskForm.valueChanges.subscribe(() => {
      if (this.taskForm.valid) {
        this.taskChange.emit(this.taskForm.getRawValue() as TaskFormData);
      }
    });
  }

  onRemove() {
    this.removeTask.emit();
  }

  // Error getters
  get nameError(): string | null {
    const control = this.taskForm.controls.name;
    if (control.hasError('required')) return 'Task name is required';
    if (control.hasError('minlength')) return 'Name must be at least 2 characters';
    return null;
  }

  get categoryError(): string | null {
    const control = this.taskForm.controls.category_id;
    if (control.hasError('required')) return 'Category is required';
    return null;
  }

  get durationError(): string | null {
    const control = this.taskForm.controls.duration_minutes;
    if (control.hasError('required')) return 'Duration is required';
    if (control.hasError('min')) return 'Minimum 5 minutes';
    if (control.hasError('max')) return 'Maximum 8 hours (480 minutes)';
    return null;
  }

  get frequencyError(): string | null {
    const control = this.taskForm.controls.target_frequency;
    if (control.hasError('required')) return 'Frequency is required';
    if (control.hasError('min')) return 'At least 1 time per week';
    if (control.hasError('max')) return 'Maximum 7 times per week';
    return null;
  }

  // Helper to get category color class
  getCategoryColor(categoryId: number): string {
    const index = this.categories().findIndex(c => c.id === categoryId);
    const colors = ['health', 'learning', 'creative', 'leisure', 'project', 'career'];
    return colors[index] || 'health';
  }

  // Calculate total hours per week for this task
  get weeklyHours(): number {
    const duration = this.taskForm.controls.duration_minutes.value;
    const frequency = this.taskForm.controls.target_frequency.value;
    return (duration * frequency) / 60;
  }

  // Format the weekly hours display
  get weeklyHoursDisplay(): string {
    const hours = this.weeklyHours;
    if (hours === 0) return '';
    if (hours < 1) return `${Math.round(hours * 60)}min/week`;
    return `${hours.toFixed(1)}h/week`;
  }
}
