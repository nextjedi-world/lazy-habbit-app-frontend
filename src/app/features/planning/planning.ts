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
import { DateUtilsService } from '../../core/services/date-utils';
import { Logger } from '../../core/services/logger';
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
  readonly dateUtils = inject(DateUtilsService); // Public for template access
  private readonly logger = inject(Logger);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  // State signals
  loading = signal(false);
  hasLastWeekPlan = signal(false);
  hasActivePlan = signal(false);
  tasks = signal<TaskInput[]>([]);
  showFAB = signal(true);

  // Auto-save draft state
  draftSaved = signal(false);
  draftSaving = signal(false);
  private autoSaveTimer: any = null;
  private readonly DRAFT_KEY = 'planning_draft';
  private readonly AUTO_SAVE_DELAY = 1000; // 1 second debounce

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

  // Which week are we planning for?
  targetWeekStart = computed(() => {
    return this.planService.getTargetWeekStart();
  });

  // Human-readable week indicator
  weekLabel = computed(() => {
    const weekStart = this.targetWeekStart();
    return this.dateUtils.formatWeekRange(weekStart);
  });

  // Check if we're in early planning mode (Fri-Sun)
  isEarlyPlanningMode = computed(() => {
    return this.dateUtils.isWeekend();
  });

  // Get edit eligibility from service
  editEligibility = computed(() => {
    const plan = this.planService.activePlan();
    return this.planService.canEditPlan(plan);
  });

  // Computed: Can user edit plan?
  canEdit = computed(() => {
    return this.editEligibility().canEdit;
  });

  // Computed: Message to display when editing is blocked
  restrictionMessage = computed(() => {
    return this.editEligibility().reason;
  });

  // Get edit window status message
  editWindowStatus = computed(() => {
    const eligibility = this.editEligibility();
    const plan = this.planService.activePlan();

    if (!plan) {
      return ''; // No plan, no status message
    }

    switch (eligibility.window) {
      case 'early-week-planning':
        return 'You can edit this plan until Sunday at 11:59 PM';

      case 'monday-all-day':
        const hoursLeft = this.dateUtils.getHoursUntilMondayMidnight();
        return `You can edit until Monday at 11:59 PM (${hoursLeft}h remaining)`;

      case 'locked':
        return 'This plan is locked until next Monday';

      default:
        return '';
    }
  });

  async ngOnInit() {
    try {
      this.loading.set(true);

      // Load active plan for the target week
      const user = this.authService.currentUser();
      if (user) {
        await this.planService.loadActivePlan(user.id);
      }

      // Check for active plan
      await this.checkActivePlan();

      // Check if user has a plan from last week
      await this.checkLastWeekPlan();

      // Load existing plan tasks for editing if allowed
      if (this.hasActivePlan() && this.canEdit()) {
        await this.loadPlanForEditing();
      }
      // Otherwise restore draft if available and no active plan
      else if (!this.hasActivePlan() && this.canEdit()) {
        this.restoreDraft();
      }
    } catch (error) {
      this.logger.error('Failed to load planning data:', error);

      const snackBarRef = this.snackBar.open(
        'Failed to load planning data. Please try again.',
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

  ngOnDestroy(): void {
    // Clear auto-save timer on component destroy
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }
  }

  /**
   * Load existing plan tasks for editing
   */
  private async loadPlanForEditing(): Promise<void> {
    try {
      const plannedTasks = this.planService.plannedTasks();

      if (plannedTasks && plannedTasks.length > 0) {
        // Convert PlannedTaskWithCategory to TaskInput format
        const taskInputs: TaskInput[] = plannedTasks.map(task => ({
          id: task.id,
          name: task.name,
          category_id: task.category_id,
          duration_minutes: task.duration_minutes,
          target_frequency: task.target_frequency,
          isValid: true
        }));

        this.tasks.set(taskInputs);
        this.logger.log('Loaded plan for editing:', taskInputs.length, 'tasks');
      }
    } catch (error) {
      this.logger.error('Failed to load plan for editing:', error);
    }
  }

  /**
   * Check if user already has an active plan for target week
   * - Mon-Thu: Check current week
   * - Fri-Sun: Check next week
   */
  private async checkActivePlan(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return;

    try {
      const weekStart = this.planService.getTargetWeekStart();
      const data = await this.planService.checkPlanExists(user.id, weekStart);
      this.hasActivePlan.set(!!data);
    } catch (err) {
      this.hasActivePlan.set(false);
    }
  }

  /**
   * Check if user has a plan to copy from (source plan)
   * - Fri-Sun: Check current week plan
   * - Mon-Thu: Check last week plan
   */
  private async checkLastWeekPlan(): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return;

    try {
      const dayOfWeek = this.dateUtils.getDayOfWeek();
      let sourceWeekStart: string;

      if (dayOfWeek >= 5) {
        // Fri-Sun: Check current week
        sourceWeekStart = this.dateUtils.getWeekStartISO();
      } else {
        // Mon-Thu: Check last week
        sourceWeekStart = this.dateUtils.getLastWeekStartISO();
      }

      const data = await this.planService.checkPlanExists(user.id, sourceWeekStart);
      this.hasLastWeekPlan.set(!!data);
    } catch (err) {
      this.hasLastWeekPlan.set(false);
    }
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

    // Trigger auto-save after adding task
    this.scheduleDraftSave();
  }

  /**
   * Remove task from list
   */
  removeTask(index: number): void {
    this.tasks.update(tasks => tasks.filter((_, i) => i !== index));

    if (this.tasks().length === 0) {
      this.showFAB.set(true);
    }

    // Trigger auto-save after removing task
    this.scheduleDraftSave();
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

    // Trigger auto-save after task change
    this.scheduleDraftSave();
  }

  /**
   * Save plan to Supabase (create new or update existing)
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
      const activePlan = this.planService.activePlan();

      let plan;
      if (activePlan) {
        // Editing existing plan - delete old tasks first
        plan = activePlan;
        const existingTasks = this.planService.plannedTasks();

        // Delete all existing tasks
        await Promise.all(
          existingTasks.map(task => this.planService.removeTask(task.id))
        );
      } else {
        // Create new plan
        plan = await this.planService.createPlan(user.id);
      }

      // Add all tasks (new or updated)
      const taskPromises = this.tasks().map(task =>
        this.planService.addTask(plan.id, {
          category_id: task.category_id,
          name: task.name,
          duration_minutes: task.duration_minutes,
          target_frequency: task.target_frequency,
        })
      );

      await Promise.all(taskPromises);

      // Clear draft after successful save
      this.clearDraft();

      const message = activePlan ? 'Plan updated successfully!' : 'Weekly plan created successfully!';
      this.snackBar.open(message, 'Close', { duration: 3000 });
      await this.router.navigate(['/dashboard']);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save plan';
      this.snackBar.open(message, 'Close', { duration: 5000 });
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Schedule auto-save with debouncing
   * Prevents excessive localStorage writes
   */
  private scheduleDraftSave(): void {
    // Clear existing timer
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer);
    }

    // Set new timer
    this.autoSaveTimer = setTimeout(() => {
      this.saveDraft();
    }, this.AUTO_SAVE_DELAY);
  }

  /**
   * Save current planning state to localStorage
   */
  private saveDraft(): void {
    try {
      this.draftSaving.set(true);

      const draft = {
        tasks: this.tasks(),
        timestamp: new Date().toISOString(),
        weekStart: this.targetWeekStart() // Use target week (current or next)
      };

      localStorage.setItem(this.DRAFT_KEY, JSON.stringify(draft));

      this.draftSaved.set(true);
      this.logger.log('Draft saved to localStorage');

      // Reset saved indicator after 2 seconds
      setTimeout(() => {
        this.draftSaved.set(false);
      }, 2000);
    } catch (error) {
      this.logger.error('Failed to save draft:', error);
    } finally {
      this.draftSaving.set(false);
    }
  }

  /**
   * Restore draft from localStorage
   */
  private restoreDraft(): void {
    try {
      const draftJson = localStorage.getItem(this.DRAFT_KEY);

      if (!draftJson) {
        this.logger.log('No draft found in localStorage');
        return;
      }

      const draft = JSON.parse(draftJson);

      // Check if draft is for target week (not just current week)
      const targetWeekStart = this.targetWeekStart();
      if (draft.weekStart !== targetWeekStart) {
        this.logger.log('Draft is for a different week, clearing it');
        this.clearDraft();
        return;
      }

      // Restore tasks from draft
      if (draft.tasks && Array.isArray(draft.tasks) && draft.tasks.length > 0) {
        this.tasks.set(draft.tasks);
        this.logger.log('Draft restored from localStorage');

        // Show warning if plan is now locked
        if (!this.canEdit()) {
          this.snackBar.open(
            'Draft restored, but plan is now locked. View only.',
            'Dismiss',
            {
              duration: 0, // Persist until dismissed
              horizontalPosition: 'center',
              verticalPosition: 'top'
            }
          );
        } else {
          this.snackBar.open(
            'Draft restored from previous session',
            'Clear',
            {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom'
            }
          ).onAction().subscribe(() => {
            this.clearDraft();
            this.tasks.set([]);
            this.snackBar.open('Draft cleared', 'Close', { duration: 2000 });
          });
        }
      }
    } catch (error) {
      this.logger.error('Failed to restore draft:', error);
      // Clear corrupted draft
      this.clearDraft();
    }
  }

  /**
   * Clear draft from localStorage
   */
  private clearDraft(): void {
    try {
      localStorage.removeItem(this.DRAFT_KEY);
      this.draftSaved.set(false);
      this.logger.log('Draft cleared from localStorage');
    } catch (error) {
      this.logger.error('Failed to clear draft:', error);
    }
  }
}
