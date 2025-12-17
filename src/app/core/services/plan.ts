import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase';
import { DateUtilsService } from './date-utils';
import { Logger } from './logger';
import { WeeklyPlan, PlannedTask, PlannedTaskWithCategory } from '../models/plan.model';

@Injectable({
  providedIn: 'root',
})
export class PlanService {
  private supabase = inject(SupabaseService);
  private dateUtils = inject(DateUtilsService);
  private logger = inject(Logger);

  // State signals
  private activePlanSignal = signal<WeeklyPlan | null>(null);
  private plannedTasksSignal = signal<PlannedTaskWithCategory[]>([]);
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  // Readonly signals
  activePlan = this.activePlanSignal.asReadonly();
  plannedTasks = this.plannedTasksSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();

  /**
   * Get Monday of current week
   * @deprecated Use DateUtilsService.getWeekStartISO() instead
   */
  private getWeekStart(date = new Date()): string {
    return this.dateUtils.getWeekStartISO(date);
  }

  /**
   * Load active plan for current week
   */
  async loadActivePlan(userId: string): Promise<void> {
    // Input validation
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID: must be a non-empty string');
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      // Ensure profile exists
      await this.ensureProfileExists(userId);

      const weekStart = this.getWeekStart();

      const { data, error } = await this.supabase.client
        .from('weekly_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start_date', weekStart)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
      this.activePlanSignal.set(data);

      if (data) {
        await this.loadPlannedTasks(data.id);
      } else {
        this.plannedTasksSignal.set([]);
      }
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to load active plan');
      throw err;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Load planned tasks for a plan
   */
  async loadPlannedTasks(planId: number): Promise<void> {
    // Input validation
    if (!planId || typeof planId !== 'number' || planId <= 0) {
      throw new Error('Invalid plan ID: must be a positive number');
    }

    this.errorSignal.set(null);

    try {
      const { data, error } = await this.supabase.client
        .from('planned_tasks')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('plan_id', planId)
        .order('category_id');

      if (error) throw error;
      this.plannedTasksSignal.set(data ?? []);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to load planned tasks');
      throw err;
    }
  }

  /**
   * Ensure user profile exists before creating plan
   * This is a safeguard for cases where the signup trigger didn't create the profile
   */
  private async ensureProfileExists(userId: string): Promise<void> {
    try {
      // Check if profile exists
      const { data: profile, error: profileError } = await this.supabase.client
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      // Profile exists, we're good
      if (profile && !profileError) {
        return;
      }

      // Profile doesn't exist - create it
      const user = await this.supabase.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error: createError } = await this.supabase.client
        .from('profiles')
        .insert({
          id: userId,
          email: user.email ?? '',
          name: user.user_metadata?.['name'] ?? 'User',
          current_tier: 0
        });

      if (createError) {
        this.logger.error('Failed to create profile:', createError);
        throw new Error('Failed to create user profile. Please contact support.');
      }

      this.logger.log('Profile created successfully for user:', userId);
    } catch (err) {
      this.logger.error('Error ensuring profile exists:', err);
      throw err;
    }
  }

  /**
   * Create new weekly plan
   */
  async createPlan(userId: string): Promise<WeeklyPlan> {
    // Input validation
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID: must be a non-empty string');
    }

    this.errorSignal.set(null);

    try {
      // Ensure profile exists before creating plan
      await this.ensureProfileExists(userId);

      const weekStart = this.getWeekStart();

      const { data, error } = await this.supabase.client
        .from('weekly_plans')
        .insert({
          user_id: userId,
          week_start_date: weekStart,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      this.activePlanSignal.set(data);
      return data;
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to create plan');
      throw err;
    }
  }

  /**
   * Add task to plan
   */
  async addTask(
    planId: number,
    task: {
      category_id: number;
      name: string;
      duration_minutes: number;
      target_frequency: number;
      template_id?: number;
    }
  ): Promise<void> {
    this.errorSignal.set(null);

    try {
      const { data, error } = await this.supabase.client
        .from('planned_tasks')
        .insert({
          plan_id: planId,
          template_id: task.template_id ?? null,
          category_id: task.category_id,
          name: task.name,
          duration_minutes: task.duration_minutes,
          target_frequency: task.target_frequency,
        })
        .select(`
          *,
          category:categories(*)
        `)
        .single();

      if (error) throw error;

      // Update local state
      const currentTasks = this.plannedTasksSignal();
      this.plannedTasksSignal.set([...currentTasks, data]);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to add task');
      throw err;
    }
  }

  /**
   * Repeat last week's plan (primary UX flow)
   */
  async repeatLastWeek(userId: string): Promise<void> {
    // Input validation
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID: must be a non-empty string');
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      // Get last week's plan
      const lastWeekStart = this.dateUtils.getLastWeekStartISO();

      const { data: lastPlan, error: planError } = await this.supabase.client
        .from('weekly_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start_date', lastWeekStart)
        .single();

      if (planError) throw new Error('No plan found from last week');

      // Get last week's tasks
      const { data: lastTasks, error: tasksError } = await this.supabase.client
        .from('planned_tasks')
        .select('*')
        .eq('plan_id', lastPlan.id);

      if (tasksError) throw tasksError;

      // Create new plan
      const newPlan = await this.createPlan(userId);

      // Copy tasks to new plan
      if (lastTasks && lastTasks.length > 0) {
        const newTasks = lastTasks.map(task => ({
          plan_id: newPlan.id,
          template_id: task.template_id,
          category_id: task.category_id,
          name: task.name,
          duration_minutes: task.duration_minutes,
          target_frequency: task.target_frequency,
        }));

        const { error: insertError } = await this.supabase.client
          .from('planned_tasks')
          .insert(newTasks);

        if (insertError) throw insertError;
      }

      // Reload plan data
      await this.loadActivePlan(userId);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to repeat last week');
      throw err;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Remove task from plan
   */
  async removeTask(taskId: number): Promise<void> {
    // Input validation
    if (!taskId || typeof taskId !== 'number' || taskId <= 0) {
      throw new Error('Invalid task ID: must be a positive number');
    }

    this.errorSignal.set(null);

    try {
      const { error } = await this.supabase.client
        .from('planned_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      // Update local state
      const currentTasks = this.plannedTasksSignal();
      this.plannedTasksSignal.set(currentTasks.filter(t => t.id !== taskId));
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to remove task');
      throw err;
    }
  }

  /**
   * Complete current plan (called on Sunday)
   */
  async completePlan(planId: number): Promise<void> {
    // Input validation
    if (!planId || typeof planId !== 'number' || planId <= 0) {
      throw new Error('Invalid plan ID: must be a positive number');
    }

    this.errorSignal.set(null);

    try {
      const { error } = await this.supabase.client
        .from('weekly_plans')
        .update({ status: 'completed' })
        .eq('id', planId);

      if (error) throw error;

      const currentPlan = this.activePlanSignal();
      if (currentPlan) {
        this.activePlanSignal.set({ ...currentPlan, status: 'completed' });
      }
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to complete plan');
      throw err;
    }
  }

  /**
   * Check if a plan exists for a specific week
   * @param userId - User ID to check
   * @param weekStartDate - Week start date in ISO format (YYYY-MM-DD)
   * @returns Plan data if exists, null otherwise
   */
  async checkPlanExists(userId: string, weekStartDate: string): Promise<WeeklyPlan | null> {
    // Input validation
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID: must be a non-empty string');
    }
    if (!weekStartDate || typeof weekStartDate !== 'string') {
      throw new Error('Invalid week start date: must be a non-empty string');
    }

    this.errorSignal.set(null);

    try {
      const { data, error } = await this.supabase.client
        .from('weekly_plans')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start_date', weekStartDate)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error - this is expected
        throw error;
      }

      return data ?? null;
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to check plan existence');
      throw err;
    }
  }

  /**
   * Clear state (for logout)
   */
  clearState(): void {
    this.activePlanSignal.set(null);
    this.plannedTasksSignal.set([]);
    this.errorSignal.set(null);
  }
}
