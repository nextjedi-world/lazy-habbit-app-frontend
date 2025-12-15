import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TaskFormComponent, TaskFormData } from './components/task-form/task-form';
import { PlanService } from '../../core/services/plan';
import { AuthService } from '../../core/services/auth';
import { Category } from '../../core/models/user.model';

interface TaskInput extends TaskFormData {
  id?: number;
  isValid: boolean;
}

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    TaskFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './planning.html',
  styleUrl: './planning.scss',
})
export class PlanningComponent implements OnInit {
  // Services
  private readonly planService = inject(PlanService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  // State signals
  loading = signal(false);
  hasLastWeekPlan = signal(false);
  tasks = signal<TaskInput[]>([]);
  showFAB = signal(true);

  // Default categories (6 categories as per spec)
  categories = signal<Category[]>([
    { id: 1, user_id: '', name: 'Health', display_order: 1, created_at: '' },
    { id: 2, user_id: '', name: 'Learning', display_order: 2, created_at: '' },
    { id: 3, user_id: '', name: 'Creative', display_order: 3, created_at: '' },
    { id: 4, user_id: '', name: 'Leisure', display_order: 4, created_at: '' },
    { id: 5, user_id: '', name: 'Project', display_order: 5, created_at: '' },
    { id: 6, user_id: '', name: 'Career', display_order: 6, created_at: '' },
  ]);

  // Computed values
  totalHours = computed(() => {
    return this.tasks().reduce((sum, task) => {
      if (task.isValid && task.duration_minutes && task.target_frequency) {
        return sum + (task.duration_minutes * task.target_frequency / 60);
      }
      return sum;
    }, 0);
  });

  isFormValid = computed(() => {
    const taskList = this.tasks();
    return taskList.length > 0 && taskList.every(t => t.isValid);
  });

  hasTasks = computed(() => this.tasks().length > 0);

  async ngOnInit() {
    await this.checkLastWeekPlan();
  }

  /**
   * Check if user has a plan from last week
   */
  private async checkLastWeekPlan(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return;

    try {
      // Get last week's plan
      const lastWeekStart = this.getWeekStart(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      const { data } = await this.planService['supabase'].client
        .from('weekly_plans')
        .select('id')
        .eq('user_id', user.id)
        .eq('week_start_date', lastWeekStart)
        .single();

      this.hasLastWeekPlan.set(!!data);
    } catch (err) {
      this.hasLastWeekPlan.set(false);
    }
  }

  /**
   * Get Monday of given week
   */
  private getWeekStart(date = new Date()): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }

  /**
   * Repeat last week's plan (one-tap feature)
   */
  async repeatLastWeek(): Promise<void> {
    this.loading.set(true);
    const user = this.authService.currentUser();

    if (!user) {
      this.snackBar.open('Please log in to continue', 'Close', { duration: 3000 });
      return;
    }

    try {
      await this.planService.repeatLastWeek(user.id);
      this.snackBar.open('Last week\'s plan copied successfully!', 'Close', { duration: 3000 });
      await this.router.navigate(['/dashboard']);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to repeat last week';
      this.snackBar.open(message, 'Close', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Start fresh plan (clears task list)
   */
  startFreshPlan(): void {
    this.tasks.set([]);
    this.showFAB.set(true);
    this.snackBar.open('Ready to create your weekly plan', 'Close', { duration: 2000 });
  }

  /**
   * Add new task to list
   */
  addTask(): void {
    const newTask: TaskInput = {
      name: '',
      category_id: 1,
      duration_minutes: 30,
      target_frequency: 1,
      isValid: false,
    };
    this.tasks.update(tasks => [...tasks, newTask]);
  }

  /**
   * Remove task from list
   */
  removeTask(index: number): void {
    this.tasks.update(tasks => tasks.filter((_, i) => i !== index));

    if (this.tasks().length === 0) {
      this.showFAB.set(true);
    }
  }

  /**
   * Update task data
   */
  onTaskChange(index: number, taskData: TaskFormData): void {
    this.tasks.update(tasks => {
      const updated = [...tasks];
      updated[index] = { ...taskData, isValid: true };
      return updated;
    });
  }

  /**
   * Save plan to Supabase
   */
  async savePlan(): Promise<void> {
    if (!this.isFormValid()) {
      this.snackBar.open('Please complete all task fields', 'Close', { duration: 3000 });
      return;
    }

    this.loading.set(true);
    const user = this.authService.currentUser();

    if (!user) {
      this.snackBar.open('Please log in to continue', 'Close', { duration: 3000 });
      return;
    }

    try {
      // Create new plan
      const plan = await this.planService.createPlan(user.id);

      // Add all tasks
      const taskPromises = this.tasks().map(task =>
        this.planService.addTask(plan.id, {
          category_id: task.category_id,
          name: task.name,
          duration_minutes: task.duration_minutes,
          target_frequency: task.target_frequency,
        })
      );

      await Promise.all(taskPromises);

      this.snackBar.open('Weekly plan created successfully!', 'Close', { duration: 3000 });
      await this.router.navigate(['/dashboard']);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save plan';
      this.snackBar.open(message, 'Close', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }
}
