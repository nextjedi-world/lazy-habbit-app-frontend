import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase';
import { WeeklyPlan, PlannedTask, PlannedTaskWithCategory } from '../models/plan.model';

@Injectable({
  providedIn: 'root',
})
export class PlanService {
  private supabase = inject(SupabaseService);

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
   */
  private getWeekStart(date = new Date()): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }

  /**
   * Load active plan for current week
   */
  async loadActivePlan(userId: string): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
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
   * Create new weekly plan
   */
  async createPlan(userId: string): Promise<WeeklyPlan> {
    this.errorSignal.set(null);

    try {
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
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      // Get last week's plan
      const lastWeekStart = this.getWeekStart(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

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
   * Clear state (for logout)
   */
  clearState(): void {
    this.activePlanSignal.set(null);
    this.plannedTasksSignal.set([]);
    this.errorSignal.set(null);
  }
}
