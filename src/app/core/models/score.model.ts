export interface CategoryScore {
  categoryId: number;
  categoryName: string;
  hourScore: number;
  taskScore: number;
  overallScore: number;
}

export interface WeeklyScore {
  id: number;
  user_id: string;
  plan_id: number;
  week_start_date: string;
  hour_score: number;
  task_score: number;
  overall_score: number;
  category_scores: CategoryScore[];
  is_clean: boolean;
  tier_track: 'promotion' | 'stable' | 'demotion';
  created_at: string;
}

export interface TierTrack {
  track: 'promotion' | 'stable' | 'demotion';
  consecutiveWeeks: number;
  weeksToChange: number; // 3 - consecutiveWeeks
}
