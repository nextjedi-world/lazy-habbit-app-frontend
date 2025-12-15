export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  current_tier: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: number;
  user_id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface TaskTemplate {
  id: number;
  user_id: string;
  category_id: number;
  name: string;
  duration_minutes: number;
  weekly_frequency: number;
  is_active: boolean;
  created_at: string;
}

export interface TierHistory {
  id: number;
  user_id: string;
  old_tier: number | null;
  new_tier: number;
  reason: string | null;
  changed_at: string;
}
