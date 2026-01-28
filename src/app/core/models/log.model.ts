export interface DailyLog {
  id: number;
  planned_task_id: number;
  user_id: string;
  log_date: string; // YYYY-MM-DD
  logged_at: string;
}
