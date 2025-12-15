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
import { PlannedTaskWithCategory } from '../../core/models/plan.model';
import { Category } from '../../core/models/user.model';

import { WeekSummaryComponent } from './components/week-summary/week-summary';
import { CategorySectionComponent } from './components/category-section/category-section';
import { BottomNav } from '../../shared/components/bottom-nav/bottom-nav';

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
    CategorySectionComponent,
    BottomNav
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly loggingService = inject(LoggingService);
  private readonly planService = inject(PlanService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  // Signals
  loading = signal(false);
  tasks = signal<PlannedTaskWithCategory[]>([]);
  hasActivePlan = signal(false);

  // Computed values
  tasksByCategory = computed(() => this.groupByCategory(this.tasks()));
  weekSummary = computed(() => this.calculateWeekSummary(this.tasks()));

  async ngOnInit() {
    await this.loadWeeklyPlan();
  }

  /**
   * Load current week's plan with tasks
   */
  async loadWeeklyPlan() {
    this.loading.set(true);
    try {
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
    } catch (error) {
      console.error('Failed to load weekly plan:', error);
      this.snackBar.open('Failed to load weekly plan', 'Dismiss', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Toggle task completion (ONE-TAP LOGGING)
   */
  async toggleTask(taskId: number) {
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
      console.error('Failed to toggle task:', error);
      this.snackBar.open('Failed to update task', 'Dismiss', { duration: 3000 });
    }
  }

  /**
   * Undo task log (called from snackbar action)
   */
  async undoTaskLog(taskId: number) {
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (!user) return;

      await this.loggingService.undoTaskCompletion(user.id, taskId);
      await this.loadWeeklyPlan();
    } catch (error) {
      console.error('Failed to undo task:', error);
      this.snackBar.open('Failed to undo task', 'Dismiss', { duration: 3000 });
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
      group.totalHours += task.duration_minutes / 60;
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
    const weekStart = this.getWeekStart();
    const weekEnd = this.getWeekEnd(weekStart);

    let completedHours = 0;
    let totalHours = 0;
    let completedTasks = 0;
    let totalTasks = 0;

    tasks.forEach(task => {
      totalHours += task.duration_minutes / 60;
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

  /**
   * Get Monday of current week
   */
  private getWeekStart(date = new Date()): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /**
   * Get Sunday of current week
   */
  private getWeekEnd(weekStart: string): string {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
