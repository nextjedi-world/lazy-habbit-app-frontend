import { Category } from './user.model';

export interface WeeklyPlan {
  id: number;
  user_id: string;
  week_start_date: string; // YYYY-MM-DD
  status: 'active' | 'completed';
  created_at: string;
}

export interface PlannedTask {
  id: number;
  plan_id: number;
  template_id: number | null;
  category_id: number;
  name: string;
  duration_minutes: number;
  target_frequency: number;
  completed_count: number;
  created_at: string;
}

export interface PlannedTaskWithCategory extends PlannedTask {
  category: Category;
}

export interface PlanEditEligibility {
  canEdit: boolean;
  reason: string;
  window: 'early-week-planning' | 'monday-all-day' | 'locked' | 'no-plan';
}
