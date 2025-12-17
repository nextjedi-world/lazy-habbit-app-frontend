import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase';
import { DateUtilsService } from './date-utils';
import { DailyLog } from '../models/log.model';

@Injectable({
  providedIn: 'root',
})
export class LoggingService {
  private supabase = inject(SupabaseService);
  private dateUtils = inject(DateUtilsService);

  // State signals
  private todayLogsSignal = signal<DailyLog[]>([]);
  private undoTimerSignal = signal<number | null>(null);
  private errorSignal = signal<string | null>(null);

  // Readonly signals
  todayLogs = this.todayLogsSignal.asReadonly();
  error = this.errorSignal.asReadonly();

  /**
   * Load today's logs
   */
  async loadTodayLogs(userId: string): Promise<void> {
    // Input validation
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID: must be a non-empty string');
    }

    this.errorSignal.set(null);

    try {
      const today = this.dateUtils.getTodayISO();

      const { data, error } = await this.supabase.client
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', today);

      if (error) throw error;
      this.todayLogsSignal.set(data ?? []);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to load logs');
      throw err;
    }
  }

  /**
   * Check if task is completed today
   */
  isTaskCompleted(taskId: number): boolean {
    return this.todayLogsSignal().some(log => log.planned_task_id === taskId);
  }

  /**
   * Get completion count for task today
   */
  getTaskCompletionCount(taskId: number): number {
    return this.todayLogsSignal().filter(log => log.planned_task_id === taskId).length;
  }

  /**
   * Log task completion (ONE-TAP LOGGING)
   */
  async logTaskCompletion(userId: string, taskId: number): Promise<void> {
    // Input validation
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID: must be a non-empty string');
    }
    if (!taskId || typeof taskId !== 'number' || taskId <= 0) {
      throw new Error('Invalid task ID: must be a positive number');
    }

    this.errorSignal.set(null);

    try {
      const today = this.dateUtils.getTodayISO();

      // Insert log
      const { data, error } = await this.supabase.client
        .from('daily_logs')
        .insert({
          planned_task_id: taskId,
          user_id: userId,
          log_date: today,
        })
        .select()
        .single();

      if (error) throw error;

      // Increment completed_count in planned_tasks
      const { error: updateError } = await this.supabase.client.rpc('increment_task_count', {
        task_id: taskId,
      });

      if (updateError) {
        // Fallback: manual increment if RPC doesn't exist
        const { data: task } = await this.supabase.client
          .from('planned_tasks')
          .select('completed_count')
          .eq('id', taskId)
          .single();

        if (task) {
          await this.supabase.client
            .from('planned_tasks')
            .update({ completed_count: task.completed_count + 1 })
            .eq('id', taskId);
        }
      }

      // Update local state
      const currentLogs = this.todayLogsSignal();
      this.todayLogsSignal.set([...currentLogs, data]);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to log task');
      throw err;
    }
  }

  /**
   * Undo task completion (only works for today's logs)
   */
  async undoTaskCompletion(userId: string, taskId: number): Promise<void> {
    // Input validation
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID: must be a non-empty string');
    }
    if (!taskId || typeof taskId !== 'number' || taskId <= 0) {
      throw new Error('Invalid task ID: must be a positive number');
    }

    this.errorSignal.set(null);

    try {
      const today = this.dateUtils.getTodayISO();

      // Find the most recent log for this task today
      const log = this.todayLogsSignal()
        .filter(l => l.planned_task_id === taskId && l.log_date === today)
        .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())[0];

      if (!log) {
        throw new Error('No log found to undo');
      }

      // Delete the log
      const { error: deleteError } = await this.supabase.client
        .from('daily_logs')
        .delete()
        .eq('id', log.id);

      if (deleteError) throw deleteError;

      // Decrement completed_count
      const { data: task } = await this.supabase.client
        .from('planned_tasks')
        .select('completed_count')
        .eq('id', taskId)
        .single();

      if (task && task.completed_count > 0) {
        await this.supabase.client
          .from('planned_tasks')
          .update({ completed_count: task.completed_count - 1 })
          .eq('id', taskId);
      }

      // Update local state
      const currentLogs = this.todayLogsSignal();
      this.todayLogsSignal.set(currentLogs.filter(l => l.id !== log.id));
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to undo task');
      throw err;
    }
  }

  /**
   * Get logs for a specific date range
   */
  async getLogsForPeriod(userId: string, startDate: string, endDate: string): Promise<DailyLog[]> {
    try {
      const { data, error } = await this.supabase.client
        .from('daily_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', startDate)
        .lte('log_date', endDate)
        .order('logged_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to load period logs');
      throw err;
    }
  }

  /**
   * Clear state (for logout)
   */
  clearState(): void {
    this.todayLogsSignal.set([]);
    this.errorSignal.set(null);
    if (this.undoTimerSignal()) {
      clearTimeout(this.undoTimerSignal()!);
      this.undoTimerSignal.set(null);
    }
  }
}
