import { Component, input, output, effect, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Category } from '../../../../core/models/user.model';
import { APP_CONSTANTS } from '../../../../core/constants/app.constants';

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
      validators: [
        Validators.required,
        Validators.minLength(APP_CONSTANTS.MIN_TASK_NAME_LENGTH),
        Validators.maxLength(APP_CONSTANTS.MAX_TASK_NAME_LENGTH)
      ],
      nonNullable: true,
    }),
    category_id: new FormControl<number | null>(null, {
      validators: [Validators.required],
    }),
    duration_minutes: new FormControl(30, {
      validators: [
        Validators.required,
        Validators.min(APP_CONSTANTS.MIN_TASK_DURATION_MINUTES),
        Validators.max(APP_CONSTANTS.MAX_TASK_DURATION_MINUTES)
      ],
      nonNullable: true,
    }),
    // Separate hours and minutes inputs for better UX
    duration_hours: new FormControl(0, {
      validators: [
        Validators.min(0),
        Validators.max(Math.floor(APP_CONSTANTS.MAX_TASK_DURATION_MINUTES / 60))
      ],
      nonNullable: true,
    }),
    duration_mins: new FormControl(30, {
      validators: [Validators.min(0), Validators.max(59)],
      nonNullable: true,
    }),
    target_frequency: new FormControl(1, {
      validators: [
        Validators.required,
        Validators.min(APP_CONSTANTS.MIN_WEEKLY_FREQUENCY),
        Validators.max(APP_CONSTANTS.MAX_WEEKLY_FREQUENCY)
      ],
      nonNullable: true,
    }),
  });

  constructor() {
    // Initialize form with task data if provided
    effect(() => {
      const taskData = this.task();
      if (taskData) {
        // Convert duration_minutes to hours and minutes
        const totalMinutes = taskData.duration_minutes;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        this.taskForm.patchValue({
          ...taskData,
          duration_hours: hours,
          duration_mins: minutes,
        }, { emitEvent: false });
      }
    });

    // Sync duration_minutes when hours or minutes change
    this.taskForm.controls.duration_hours.valueChanges.subscribe(() => {
      this.updateDurationMinutes();
    });

    this.taskForm.controls.duration_mins.valueChanges.subscribe(() => {
      this.updateDurationMinutes();
    });

    // Emit changes on value change
    this.taskForm.valueChanges.subscribe(() => {
      if (this.taskForm.valid) {
        this.taskChange.emit(this.taskForm.getRawValue() as TaskFormData);
      }
    });
  }

  private updateDurationMinutes() {
    const hours = this.taskForm.controls.duration_hours.value;
    const minutes = this.taskForm.controls.duration_mins.value;
    const totalMinutes = (hours * 60) + minutes;

    // Ensure total is within valid range
    if (totalMinutes >= APP_CONSTANTS.MIN_TASK_DURATION_MINUTES &&
        totalMinutes <= APP_CONSTANTS.MAX_TASK_DURATION_MINUTES) {
      this.taskForm.controls.duration_minutes.setValue(totalMinutes, { emitEvent: false });
    }
  }

  onRemove() {
    this.removeTask.emit();
  }

  /**
   * Select all text when duration field is focused
   * Improves UX by allowing immediate typing to replace default values
   */
  onDurationFocus(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    if (input && input.select) {
      // Use setTimeout to ensure selection happens after Angular's change detection
      setTimeout(() => input.select(), 0);
    }
  }

  // Error getters
  get nameError(): string | null {
    const control = this.taskForm.controls.name;
    if (control.hasError('required')) return 'Task name is required';
    if (control.hasError('minlength'))
      return `Name must be at least ${APP_CONSTANTS.MIN_TASK_NAME_LENGTH} characters`;
    if (control.hasError('maxlength'))
      return `Name must be at most ${APP_CONSTANTS.MAX_TASK_NAME_LENGTH} characters`;
    return null;
  }

  get categoryError(): string | null {
    const control = this.taskForm.controls.category_id;
    if (control.hasError('required')) return 'Category is required';
    return null;
  }

  get durationError(): string | null {
    const totalMinutes = this.taskForm.controls.duration_minutes.value;
    if (totalMinutes < APP_CONSTANTS.MIN_TASK_DURATION_MINUTES)
      return `Minimum ${APP_CONSTANTS.MIN_TASK_DURATION_MINUTES} minutes total`;
    if (totalMinutes > APP_CONSTANTS.MAX_TASK_DURATION_MINUTES)
      return `Maximum ${Math.floor(APP_CONSTANTS.MAX_TASK_DURATION_MINUTES / 60)} hours (${APP_CONSTANTS.MAX_TASK_DURATION_MINUTES} minutes) total`;
    return null;
  }

  get hoursError(): string | null {
    const control = this.taskForm.controls.duration_hours;
    const maxHours = Math.floor(APP_CONSTANTS.MAX_TASK_DURATION_MINUTES / 60);
    if (control.hasError('max')) return `Max ${maxHours} hours`;
    return null;
  }

  get minsError(): string | null {
    const control = this.taskForm.controls.duration_mins;
    if (control.hasError('max')) return 'Max 59 mins';
    return null;
  }

  get frequencyError(): string | null {
    const control = this.taskForm.controls.target_frequency;
    if (control.hasError('required')) return 'Frequency is required';
    if (control.hasError('min'))
      return `At least ${APP_CONSTANTS.MIN_WEEKLY_FREQUENCY} time per week`;
    if (control.hasError('max'))
      return `Maximum ${APP_CONSTANTS.MAX_WEEKLY_FREQUENCY} times per week`;
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
