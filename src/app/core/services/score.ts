import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase';
import { WeeklyScore, CategoryScore, TierTrack } from '../models/score.model';
import { PlannedTaskWithCategory } from '../models/plan.model';
import { Category } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class ScoreService {
  private supabase = inject(SupabaseService);

  // State signals
  private currentScoreSignal = signal<WeeklyScore | null>(null);
  private recentScoresSignal = signal<WeeklyScore[]>([]);
  private tierTrackSignal = signal<TierTrack | null>(null);
  private errorSignal = signal<string | null>(null);

  // Readonly signals
  currentScore = this.currentScoreSignal.asReadonly();
  recentScores = this.recentScoresSignal.asReadonly();
  tierTrack = this.tierTrackSignal.asReadonly();
  error = this.errorSignal.asReadonly();

  /**
   * Calculate weekly score based on planned tasks
   */
  calculateScore(tasks: PlannedTaskWithCategory[], categories: Category[]): {
    hourScore: number;
    taskScore: number;
    overallScore: number;
    categoryScores: CategoryScore[];
    isClean: boolean;
  } {
    if (tasks.length === 0) {
      return {
        hourScore: 0,
        taskScore: 0,
        overallScore: 0,
        categoryScores: [],
        isClean: true,
      };
    }

    // Group tasks by category
    const tasksByCategory = tasks.reduce((acc, task) => {
      const catId = task.category_id;
      if (!acc[catId]) {
        acc[catId] = [];
      }
      acc[catId].push(task);
      return acc;
    }, {} as Record<number, PlannedTaskWithCategory[]>);

    // Calculate category scores
    const categoryScores: CategoryScore[] = Object.entries(tasksByCategory).map(([catId, catTasks]) => {
      const category = categories.find(c => c.id === Number(catId));

      // Calculate hours
      const totalHours = catTasks.reduce(
        (sum, t) => sum + (t.duration_minutes * t.target_frequency) / 60,
        0
      );
      const completedHours = catTasks.reduce(
        (sum, t) => sum + (t.duration_minutes * Math.min(t.completed_count, t.target_frequency)) / 60,
        0
      );
      const hourScore = totalHours > 0 ? completedHours / totalHours : 0;

      // Calculate tasks
      const totalTaskFrequency = catTasks.reduce((sum, t) => sum + t.target_frequency, 0);
      const completedTaskFrequency = catTasks.reduce(
        (sum, t) => sum + Math.min(t.completed_count, t.target_frequency),
        0
      );
      const taskScore = totalTaskFrequency > 0 ? completedTaskFrequency / totalTaskFrequency : 0;

      // Overall category score
      const overallScore = (hourScore + taskScore) / 2;

      return {
        categoryId: Number(catId),
        categoryName: category?.name ?? 'Unknown',
        hourScore,
        taskScore,
        overallScore,
      };
    });

    // Calculate overall scores
    const totalHours = tasks.reduce(
      (sum, t) => sum + (t.duration_minutes * t.target_frequency) / 60,
      0
    );
    const completedHours = tasks.reduce(
      (sum, t) => sum + (t.duration_minutes * Math.min(t.completed_count, t.target_frequency)) / 60,
      0
    );
    const hourScore = totalHours > 0 ? completedHours / totalHours : 0;

    const totalTaskFrequency = tasks.reduce((sum, t) => sum + t.target_frequency, 0);
    const completedTaskFrequency = tasks.reduce(
      (sum, t) => sum + Math.min(t.completed_count, t.target_frequency),
      0
    );
    const taskScore = totalTaskFrequency > 0 ? completedTaskFrequency / totalTaskFrequency : 0;

    const overallScore = (hourScore + taskScore) / 2;

    // Check if clean week (all categories >= 50%)
    const isClean = categoryScores.every(cs => cs.overallScore >= 0.5);

    return {
      hourScore,
      taskScore,
      overallScore,
      categoryScores,
      isClean,
    };
  }

  /**
   * Determine tier track based on score
   */
  determineTierTrack(score: number, categoryScores: CategoryScore[]): 'promotion' | 'stable' | 'demotion' {
    const belowThresholdCount = categoryScores.filter(cs => cs.overallScore < 0.5).length;

    // Promotion: 80%+ overall AND all categories >= 50%
    if (score >= 0.8 && belowThresholdCount === 0) {
      return 'promotion';
    }

    // Demotion: Below 60% overall OR two+ categories below 50%
    if (score < 0.6 || belowThresholdCount >= 2) {
      return 'demotion';
    }

    // Stable: 60-79% overall OR one category below 50%
    return 'stable';
  }

  /**
   * Save weekly score to database
   */
  async saveWeeklyScore(
    userId: string,
    planId: number,
    weekStartDate: string,
    scoreData: {
      hourScore: number;
      taskScore: number;
      overallScore: number;
      categoryScores: CategoryScore[];
      isClean: boolean;
    }
  ): Promise<void> {
    this.errorSignal.set(null);

    try {
      const tierTrack = this.determineTierTrack(scoreData.overallScore, scoreData.categoryScores);

      const { data, error } = await this.supabase.client
        .from('weekly_scores')
        .upsert({
          user_id: userId,
          plan_id: planId,
          week_start_date: weekStartDate,
          hour_score: scoreData.hourScore,
          task_score: scoreData.taskScore,
          overall_score: scoreData.overallScore,
          category_scores: scoreData.categoryScores,
          is_clean: scoreData.isClean,
          tier_track: tierTrack,
        })
        .select()
        .single();

      if (error) throw error;
      this.currentScoreSignal.set(data);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to save score');
      throw err;
    }
  }

  /**
   * Load recent scores for tier track calculation
   */
  async loadRecentScores(userId: string, limit = 3): Promise<void> {
    this.errorSignal.set(null);

    try {
      const { data, error } = await this.supabase.client
        .from('weekly_scores')
        .select('*')
        .eq('user_id', userId)
        .order('week_start_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      this.recentScoresSignal.set(data ?? []);

      // Calculate tier track
      this.calculateTierTrack(data ?? []);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to load recent scores');
      throw err;
    }
  }

  /**
   * Calculate tier track from recent scores
   */
  private calculateTierTrack(scores: WeeklyScore[]): void {
    if (scores.length === 0) {
      this.tierTrackSignal.set(null);
      return;
    }

    const currentTrack = scores[0].tier_track;
    let consecutiveWeeks = 1;

    // Count consecutive weeks on same track
    for (let i = 1; i < scores.length; i++) {
      if (scores[i].tier_track === currentTrack) {
        consecutiveWeeks++;
      } else {
        break;
      }
    }

    this.tierTrackSignal.set({
      track: currentTrack,
      consecutiveWeeks,
      weeksToChange: Math.max(0, 3 - consecutiveWeeks),
    });
  }

  /**
   * Load score for specific week
   */
  async loadScoreForWeek(userId: string, weekStartDate: string): Promise<WeeklyScore | null> {
    try {
      const { data, error } = await this.supabase.client
        .from('weekly_scores')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start_date', weekStartDate)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
      return data;
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to load score');
      throw err;
    }
  }

  /**
   * Clear state (for logout)
   */
  clearState(): void {
    this.currentScoreSignal.set(null);
    this.recentScoresSignal.set([]);
    this.tierTrackSignal.set(null);
    this.errorSignal.set(null);
  }
}
