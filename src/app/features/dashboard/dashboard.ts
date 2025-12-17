import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { LoggingService } from '../../core/services/logging';
import { PlanService } from '../../core/services/plan';
import { SupabaseService } from '../../core/services/supabase';
import { DateUtilsService } from '../../core/services/date-utils';
import { Logger } from '../../core/services/logger';
import { PlannedTaskWithCategory } from '../../core/models/plan.model';
import { Category } from '../../core/models/user.model';

import { WeekSummaryComponent } from './components/week-summary/week-summary';
import { CategorySectionComponent } from './components/category-section/category-section';

interface CategoryGroup {
  category: Category;
  tasks: PlannedTaskWithCategory[];
  completedHours: number;
  totalHours: number;
  completedTasks: number;
  totalTasks: number;
  progress: number;
}

interface WeekSummary {
  weekStart: string;
  weekEnd: string;
  completedHours: number;
  totalHours: number;
  completedTasks: number;
  totalTasks: number;
  overallProgress: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    MatSnackBarModule,
    WeekSummaryComponent,
    CategorySectionComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly loggingService = inject(LoggingService);
  private readonly planService = inject(PlanService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly dateUtils = inject(DateUtilsService);
  private readonly logger = inject(Logger);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  // Signals
  loading = signal(false);
  tasks = signal<PlannedTaskWithCategory[]>([]);
  hasActivePlan = signal(false);
  taskLoading = signal<Record<number, boolean>>({});  // Track loading state per task
  private taskToggleInProgress = new Set<number>();    // Prevent duplicate toggles

  // Computed values
  tasksByCategory = computed(() => this.groupByCategory(this.tasks()));
  weekSummary = computed(() => this.calculateWeekSummary(this.tasks()));

  async ngOnInit() {
    try {
      this.loading.set(true);
      await this.loadWeeklyPlan();
    } catch (error) {
      this.logger.error('Failed to load dashboard data:', error);

      const snackBarRef = this.snackBar.open(
        'Failed to load dashboard data. Please try again.',
        'Retry',
        {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        }
      );

      snackBarRef.onAction().subscribe(() => {
        this.ngOnInit(); // Retry on button click
      });
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Load current week's plan with tasks
   */
  async loadWeeklyPlan() {
    const user = await this.supabaseService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Load active plan
    await this.planService.loadActivePlan(user.id);
    const activePlan = this.planService.activePlan();

    if (activePlan) {
      this.hasActivePlan.set(true);
      // Get tasks from plan service
      const plannedTasks = this.planService.plannedTasks();
      this.tasks.set(plannedTasks);

      // Load today's logs
      await this.loggingService.loadTodayLogs(user.id);
    } else {
      this.hasActivePlan.set(false);
      this.tasks.set([]);
    }
  }

  /**
   * Toggle task completion (ONE-TAP LOGGING)
   * Includes debouncing and loading state
   */
  async toggleTask(taskId: number) {
    // Debounce: Prevent duplicate clicks
    if (this.taskToggleInProgress.has(taskId)) {
      return;
    }

    this.taskToggleInProgress.add(taskId);
    this.taskLoading.update(state => ({ ...state, [taskId]: true }));

    try {
      const user = await this.supabaseService.getCurrentUser();
      if (!user) return;

      const isCompleted = this.loggingService.isTaskCompleted(taskId);

      if (isCompleted) {
        // Undo completion
        await this.loggingService.undoTaskCompletion(user.id, taskId);
        this.snackBar.open('Task unmarked', 'Dismiss', { duration: 2000 });
      } else {
        // Mark as complete
        await this.loggingService.logTaskCompletion(user.id, taskId);

        // Show undo snackbar
        const snackBarRef = this.snackBar.open('Task completed', 'UNDO', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });

        // Handle undo action
        snackBarRef.onAction().subscribe(async () => {
          await this.undoTaskLog(taskId);
        });
      }

      // Reload plan to update completed counts
      await this.loadWeeklyPlan();
    } catch (error) {
      this.logger.error('Failed to toggle task:', error);
      this.snackBar.open('Failed to update task', 'Dismiss', { duration: 3000 });
    } finally {
      // Cleanup: Remove loading state and debounce lock
      this.taskLoading.update(state => ({ ...state, [taskId]: false }));
      this.taskToggleInProgress.delete(taskId);
    }
  }

  /**
   * Undo task log (called from snackbar action)
   */
  async undoTaskLog(taskId: number) {
    this.taskLoading.update(state => ({ ...state, [taskId]: true }));

    try {
      const user = await this.supabaseService.getCurrentUser();
      if (!user) return;

      await this.loggingService.undoTaskCompletion(user.id, taskId);
      await this.loadWeeklyPlan();
    } catch (error) {
      this.logger.error('Failed to undo task:', error);
      this.snackBar.open('Failed to undo task', 'Dismiss', { duration: 3000 });
    } finally {
      this.taskLoading.update(state => ({ ...state, [taskId]: false }));
    }
  }

  /**
   * Navigate to planning screen
   */
  navigateToPlanning() {
    this.router.navigate(['/planning']);
  }

  /**
   * Group tasks by category
   */
  private groupByCategory(tasks: PlannedTaskWithCategory[]): CategoryGroup[] {
    const categoryMap = new Map<number, CategoryGroup>();

    tasks.forEach(task => {
      const categoryId = task.category_id;
      const isCompleted = this.loggingService.isTaskCompleted(task.id);
      const completedCount = task.completed_count;

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          category: task.category,
          tasks: [],
          completedHours: 0,
          totalHours: 0,
          completedTasks: 0,
          totalTasks: 0,
          progress: 0
        });
      }

      const group = categoryMap.get(categoryId)!;
      group.tasks.push(task);
      group.totalHours += (task.duration_minutes * task.target_frequency) / 60;
      group.totalTasks += task.target_frequency;
      group.completedHours += (completedCount * task.duration_minutes) / 60;
      group.completedTasks += completedCount;
    });

    // Calculate progress for each category
    categoryMap.forEach(group => {
      if (group.totalTasks > 0) {
        const hourScore = group.totalHours > 0 ? group.completedHours / group.totalHours : 0;
        const taskScore = group.completedTasks / group.totalTasks;
        group.progress = ((hourScore + taskScore) / 2) * 100;
      }
    });

    // Sort by category display_order
    return Array.from(categoryMap.values()).sort(
      (a, b) => a.category.display_order - b.category.display_order
    );
  }

  /**
   * Calculate week summary
   */
  private calculateWeekSummary(tasks: PlannedTaskWithCategory[]): WeekSummary {
    const weekStart = this.dateUtils.getWeekRangeString().split(' - ')[0];
    const weekEnd = this.dateUtils.getWeekRangeString().split(' - ')[1];

    let completedHours = 0;
    let totalHours = 0;
    let completedTasks = 0;
    let totalTasks = 0;

    tasks.forEach(task => {
      totalHours += (task.duration_minutes * task.target_frequency) / 60;
      totalTasks += task.target_frequency;
      completedHours += (task.completed_count * task.duration_minutes) / 60;
      completedTasks += task.completed_count;
    });

    const hourScore = totalHours > 0 ? completedHours / totalHours : 0;
    const taskScore = totalTasks > 0 ? completedTasks / totalTasks : 0;
    const overallProgress = totalTasks > 0 ? ((hourScore + taskScore) / 2) * 100 : 0;

    return {
      weekStart,
      weekEnd,
      completedHours: Math.round(completedHours * 10) / 10,
      totalHours: Math.round(totalHours * 10) / 10,
      completedTasks,
      totalTasks,
      overallProgress: Math.round(overallProgress)
    };
  }

}
