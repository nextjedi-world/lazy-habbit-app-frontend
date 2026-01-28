-- ============================================================================
-- LAZY HABBIT APP - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- This migration creates all tables, indexes, triggers, and RLS policies
-- for the Lazy Habbit App (Quota Life Planning System)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- DROP EXISTING OBJECTS (Clean Slate)
-- ============================================================================

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS increment_task_count(BIGINT);
DROP FUNCTION IF EXISTS decrement_task_count(BIGINT);

-- Drop tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS tier_history CASCADE;
DROP TABLE IF EXISTS weekly_scores CASCADE;
DROP TABLE IF EXISTS daily_logs CASCADE;
DROP TABLE IF EXISTS planned_tasks CASCADE;
DROP TABLE IF EXISTS weekly_plans CASCADE;
DROP TABLE IF EXISTS task_templates CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  current_tier INTEGER DEFAULT 0 CHECK (current_tier >= 0 AND current_tier <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'User profiles with tier tracking';
COMMENT ON COLUMN profiles.current_tier IS 'User tier from 0-10, determines weekly quota expectations';

-- Categories table
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE categories IS 'User-defined task categories (Health, Learning, Creative, etc.)';

-- Task templates (reusable task definitions)
CREATE TABLE task_templates (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  weekly_frequency INTEGER NOT NULL CHECK (weekly_frequency >= 1 AND weekly_frequency <= 7),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE task_templates IS 'Reusable task definitions for weekly planning';

-- Weekly plans
CREATE TABLE weekly_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  week_start_date DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'completed')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start_date)
);

COMMENT ON TABLE weekly_plans IS 'Weekly goal plans (Monday-Sunday)';
COMMENT ON COLUMN weekly_plans.week_start_date IS 'Monday of the week (YYYY-MM-DD)';

-- Planned tasks (instances of templates for a specific week)
CREATE TABLE planned_tasks (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT REFERENCES weekly_plans(id) ON DELETE CASCADE NOT NULL,
  template_id BIGINT REFERENCES task_templates(id) ON DELETE SET NULL,
  category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  target_frequency INTEGER NOT NULL CHECK (target_frequency >= 1 AND target_frequency <= 7),
  completed_count INTEGER DEFAULT 0 CHECK (completed_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE planned_tasks IS 'Tasks scheduled for a specific week';
COMMENT ON COLUMN planned_tasks.completed_count IS 'Number of times completed this week';

-- Daily logs (task completions)
CREATE TABLE daily_logs (
  id BIGSERIAL PRIMARY KEY,
  planned_task_id BIGINT REFERENCES planned_tasks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(planned_task_id, log_date, user_id)
);

COMMENT ON TABLE daily_logs IS 'Individual task completion logs (one-tap logging)';
COMMENT ON COLUMN daily_logs.log_date IS 'Date when task was completed';

-- Weekly scores
CREATE TABLE weekly_scores (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan_id BIGINT REFERENCES weekly_plans(id) ON DELETE CASCADE NOT NULL,
  week_start_date DATE NOT NULL,
  hour_score DECIMAL(3,2) CHECK (hour_score >= 0 AND hour_score <= 1),
  task_score DECIMAL(3,2) CHECK (task_score >= 0 AND task_score <= 1),
  overall_score DECIMAL(3,2) CHECK (overall_score >= 0 AND overall_score <= 1),
  category_scores JSONB,
  is_clean BOOLEAN DEFAULT FALSE,
  tier_track TEXT CHECK (tier_track IN ('promotion', 'stable', 'demotion')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start_date)
);

COMMENT ON TABLE weekly_scores IS 'Weekly performance scores and tier evaluation';
COMMENT ON COLUMN weekly_scores.is_clean IS 'True if all categories >= 50%';
COMMENT ON COLUMN weekly_scores.tier_track IS 'promotion (80%+), stable (60-79%), demotion (<60%)';

-- Tier history (tracks tier changes over time)
CREATE TABLE tier_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  old_tier INTEGER CHECK (old_tier >= 0 AND old_tier <= 10),
  new_tier INTEGER CHECK (new_tier >= 0 AND new_tier <= 10),
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE tier_history IS 'Tracks tier promotions/demotions (3-week rule)';

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_task_templates_user_id ON task_templates(user_id);
CREATE INDEX idx_task_templates_category_id ON task_templates(category_id);
CREATE INDEX idx_task_templates_active ON task_templates(user_id, is_active);
CREATE INDEX idx_weekly_plans_user_id ON weekly_plans(user_id);
CREATE INDEX idx_weekly_plans_week_start ON weekly_plans(week_start_date);
CREATE INDEX idx_weekly_plans_user_status ON weekly_plans(user_id, status);
CREATE INDEX idx_planned_tasks_plan_id ON planned_tasks(plan_id);
CREATE INDEX idx_planned_tasks_category ON planned_tasks(category_id);
CREATE INDEX idx_daily_logs_user_id ON daily_logs(user_id);
CREATE INDEX idx_daily_logs_date ON daily_logs(log_date);
CREATE INDEX idx_daily_logs_task_date ON daily_logs(planned_task_id, log_date);
CREATE INDEX idx_weekly_scores_user_id ON weekly_scores(user_id);
CREATE INDEX idx_weekly_scores_week ON weekly_scores(week_start_date);
CREATE INDEX idx_tier_history_user_id ON tier_history(user_id);

-- ============================================================================
-- CREATE FUNCTIONS
-- ============================================================================

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create profile when user signs up (CRITICAL)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, skip
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment task completion count
CREATE OR REPLACE FUNCTION increment_task_count(task_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE planned_tasks
  SET completed_count = completed_count + 1
  WHERE id = task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrement task completion count (for undo)
CREATE OR REPLACE FUNCTION decrement_task_count(task_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE planned_tasks
  SET completed_count = GREATEST(0, completed_count - 1)
  WHERE id = task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Categories policies
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- Task templates policies
CREATE POLICY "Users can view own templates"
  ON task_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates"
  ON task_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates"
  ON task_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates"
  ON task_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Weekly plans policies
CREATE POLICY "Users can view own plans"
  ON weekly_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans"
  ON weekly_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
  ON weekly_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans"
  ON weekly_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Planned tasks policies
CREATE POLICY "Users can view own planned tasks"
  ON planned_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM weekly_plans
      WHERE id = planned_tasks.plan_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own planned tasks"
  ON planned_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weekly_plans
      WHERE id = planned_tasks.plan_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own planned tasks"
  ON planned_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM weekly_plans
      WHERE id = planned_tasks.plan_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own planned tasks"
  ON planned_tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM weekly_plans
      WHERE id = planned_tasks.plan_id
      AND user_id = auth.uid()
    )
  );

-- Daily logs policies
CREATE POLICY "Users can view own logs"
  ON daily_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON daily_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs"
  ON daily_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs"
  ON daily_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Weekly scores policies
CREATE POLICY "Users can view own scores"
  ON weekly_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scores"
  ON weekly_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scores"
  ON weekly_scores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scores"
  ON weekly_scores FOR DELETE
  USING (auth.uid() = user_id);

-- Tier history policies
CREATE POLICY "Users can view own tier history"
  ON tier_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tier history"
  ON tier_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ============================================================================
-- VERIFICATION QUERIES (commented out, for manual testing)
-- ============================================================================

-- Check tables
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check triggers
-- SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public';

-- Check functions
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY routine_name;
