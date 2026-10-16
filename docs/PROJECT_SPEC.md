# Lazy Habbit App: full product and engineering spec

Moved verbatim from the former 649-line CLAUDE.md so that CLAUDE.md stays short. CLAUDE.md has the commands and the rules; this file has the detail (schema SQL, Supabase query patterns, phase scope, getting-started checklist).

---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Note**: Project name is **Lazy Habbit App** (subject to change)

## Project Overview

**Lazy Habbit App** is a flexible habit tracking and productivity system built on the principle of "structural freedom" - weekly quotas instead of rigid daily schedules. The app uses a tier-based progression system (0-10) that rewards consistency over intensity, with a 3-week buffer to absorb temporary setbacks.

**Phase 1 Target:** Angular PWA for 2 users (MVP), using Supabase (Postgres + Auth) as backend. Multi-device sync and social logins available from day one.

## Implementation Status

**Phase 1 Foundation: COMPLETE ✅** (December 15, 2025)

### Completed
- ✅ **Angular 21 Project Setup** - Standalone components, strict TypeScript, SCSS
- ✅ **Supabase Integration** - Client configured with environment credentials
- ✅ **Core Services** - SupabaseService, AuthService, ScoreService, UserService implemented
- ✅ **Data Models** - User, Plan, Score, Log, Category interfaces defined
- ✅ **Category CRUD System** - Full category management with preset colors/icons
- ✅ **Shared Pipes** - DurationPipe, PercentagePipe with full test coverage
- ✅ **Test Suite** - 78 passing tests (100% success rate) using Vitest
- ✅ **Business Logic Validation** - Scoring formula, tier system, 3-week buffer tested
- ✅ **Bundle Optimization** - 55.77 kB (89% under 500KB target)
- ✅ **Development Server** - Running on localhost:4200
- ✅ **Planning Component** - Weekly goal setting with category management (December 22, 2024)

### In Progress
- 🚧 **Authentication UI** - Login/Register components
- 🚧 **Dashboard Component** - Task logging with one-tap UX
- 🚧 **Review Component** - Sunday week review with scoring
- 🚧 **Profile Component** - Tier history and stats

### Pending
- ⏳ **Material Theme** - Custom colors, typography, accessibility
- ⏳ **PWA Configuration** - Icons, manifest, service worker
- ⏳ **Deployment** - Production build, Vercel hosting

**For detailed implementation summary, see**: `frontend/lazy-habbit-app/IMPLEMENTATION_SUMMARY.md`

## Core Philosophy

- **Flexible quotas over rigid schedules**: "Gym 3x this week" not "Gym Monday 7am"
- **No mid-week edits**: Set goals Monday, live with them; tier buffer absorbs bad weeks
- **One-tap logging**: Trust the user, no duration input, no friction
- **25-35 hours/week structured time**: Success with minimal effort, not burnout
- **Longevity over intensity**: 5 years of showing up beats one heroic month

## System Mechanics

### Weekly Rhythm
- **Monday AM**: Goal setting (repeat last week / edit / fresh start)
- **Daily**: Two logging windows (before 3pm, before 8pm)
- **Thursday**: Mid-week checkpoint notification
- **Sunday**: Week review with scoring and tier evaluation

### Tier System (0-10)
- **Promotion track**: 80%+ overall score AND all categories ≥50%
- **Stable track**: 60-79% overall OR one category below 50%
- **Demotion track**: Below 60% overall OR two+ categories below 50%
- **Movement rule**: 3 consecutive weeks on same track → tier change

### Scoring Formula
```
Weekly Score = (Hours Completed / Hours Scheduled + Tasks Completed / Tasks Scheduled) / 2
```
This dual metric prevents gaming the system by cherry-picking easy tasks or ignoring small ones.

## Tech Stack

### Phase 1 (Current - MVP with Backend)

- **Frontend**: Angular 21.0.3 with standalone components
- **Backend**: Supabase (open-source Firebase alternative)
  - **Database**: PostgreSQL (managed by Supabase)
  - **Authentication**: Supabase Auth (email/password + social logins)
  - **Real-time**: PostgreSQL subscriptions (optional for live updates)
  - **Storage**: Supabase Storage (for future file uploads if needed)
- **PWA**: Angular PWA (`@angular/pwa`) for offline caching and installability
- **API Client**: `@supabase/supabase-js` (official Angular/TypeScript client)
- **Testing**: Vitest 4.0.15 (Angular 21 default, replacing Jasmine/Karma)
- **UI Components**: Angular Material 21 (Material Design 3)
- **Hosting**: Vercel (free tier for Angular app)

**Key Benefits**:
- Multi-device sync out of the box
- Social logins ready (Google, GitHub, etc.) with 2-click setup
- Automatic backups and point-in-time recovery
- Real Postgres (powerful SQL queries, full-text search, aggregations)
- Row-level security (RLS) for data isolation
- Free tier: 500MB database, 50,000 monthly active users
- Self-hostable if needed (avoid vendor lock-in)

**Trade-offs**:
- Requires internet connection (can add offline support later)
- Slightly more complex than pure local storage
- Free tier limits (plenty for 2 users, but exists)

### Phase 2 (Future Enhancements)

- **Mobile**: Evaluate PWA performance, consider Flutter if native UX needed
- **Offline-first**: Add local IndexedDB cache with Supabase sync
- **Notifications**: Push API for PWA or Firebase Cloud Messaging
- **Advanced features**: Reward system, project tracking, analytics

## Angular Architecture

The project follows a modular Angular structure organized by feature:

```
/src/app
  /core
    /services
      - supabase.service.ts    - Supabase client initialization and configuration
      - auth.service.ts        - Login, register, logout (wraps Supabase Auth)
      - user.service.ts        - User profile and tier tracking operations
      - plan.service.ts        - Weekly plan CRUD (Supabase queries)
      - logging.service.ts     - Task completion logging
      - score.service.ts       - Weekly score calculation and tier evaluation
    /guards
      - auth.guard.ts          - Route protection using Supabase auth state
    /models
      - database.types.ts      - Generated TypeScript types from Supabase schema
      - user.model.ts          - User, Category, TaskTemplate interfaces
      - plan.model.ts          - WeeklyPlan, PlannedTask interfaces
      - score.model.ts         - WeeklyScore, TierHistory interfaces
      - log.model.ts           - DailyLog interface
    /interceptors
      - auth.interceptor.ts    - Attach Supabase session token to requests (if needed)
  /features
    /auth
      - login/               - Login component (email/password + social buttons)
      - register/            - Registration component
    /dashboard               - Main screen with task list and week summary
    /planning                - Weekly planning interface with repeat/edit/fresh options
    /review                  - Sunday week review with scores and tier status
    /profile                 - User profile, tier history graph, stats
  /shared
    /components              - Reusable UI components (progress dots, category cards)
  /environments
    - environment.ts         - Supabase URL and anon key configuration
```

## Database Schema (PostgreSQL via Supabase)

### Schema Overview

The database uses PostgreSQL with Row-Level Security (RLS) policies to ensure users can only access their own data. Supabase manages the database and provides auto-generated REST/GraphQL APIs.

### SQL Migration (Create Tables)

```sql
-- Enable UUID extension for user IDs (Supabase Auth uses UUIDs)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table is managed by Supabase Auth (auth.users)
-- We extend it with a profiles table for additional user data
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  current_tier INTEGER DEFAULT 0 CHECK (current_tier >= 0 AND current_tier <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task templates (reusable task definitions)
CREATE TABLE task_templates (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  weekly_frequency INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly plans
CREATE TABLE weekly_plans (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  status TEXT CHECK (status IN ('active', 'completed')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start_date)
);

-- Planned tasks (instances of templates for a specific week)
CREATE TABLE planned_tasks (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT REFERENCES weekly_plans(id) ON DELETE CASCADE,
  template_id BIGINT REFERENCES task_templates(id) ON DELETE SET NULL,
  category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  target_frequency INTEGER NOT NULL,
  completed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily logs (task completions)
CREATE TABLE daily_logs (
  id BIGSERIAL PRIMARY KEY,
  planned_task_id BIGINT REFERENCES planned_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(planned_task_id, log_date, user_id)
);

-- Weekly scores
CREATE TABLE weekly_scores (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id BIGINT REFERENCES weekly_plans(id) ON DELETE CASCADE,
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

-- Tier history (tracks tier changes over time)
CREATE TABLE tier_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  old_tier INTEGER,
  new_tier INTEGER,
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_task_templates_user_id ON task_templates(user_id);
CREATE INDEX idx_task_templates_category_id ON task_templates(category_id);
CREATE INDEX idx_weekly_plans_user_id ON weekly_plans(user_id);
CREATE INDEX idx_weekly_plans_week_start ON weekly_plans(week_start_date);
CREATE INDEX idx_planned_tasks_plan_id ON planned_tasks(plan_id);
CREATE INDEX idx_daily_logs_user_id ON daily_logs(user_id);
CREATE INDEX idx_daily_logs_date ON daily_logs(log_date);
CREATE INDEX idx_weekly_scores_user_id ON weekly_scores(user_id);
CREATE INDEX idx_tier_history_user_id ON tier_history(user_id);
```

### Row-Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_history ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Categories: Users can only access their own categories
CREATE POLICY "Users can manage own categories" ON categories FOR ALL USING (auth.uid() = user_id);

-- Task templates: Users can only access their own templates
CREATE POLICY "Users can manage own templates" ON task_templates FOR ALL USING (auth.uid() = user_id);

-- Weekly plans: Users can only access their own plans
CREATE POLICY "Users can manage own plans" ON weekly_plans FOR ALL USING (auth.uid() = user_id);

-- Planned tasks: Users can only access tasks from their own plans
CREATE POLICY "Users can manage own planned tasks" ON planned_tasks FOR ALL
  USING (EXISTS (SELECT 1 FROM weekly_plans WHERE id = plan_id AND user_id = auth.uid()));

-- Daily logs: Users can only access their own logs
CREATE POLICY "Users can manage own logs" ON daily_logs FOR ALL USING (auth.uid() = user_id);

-- Weekly scores: Users can only access their own scores
CREATE POLICY "Users can manage own scores" ON weekly_scores FOR ALL USING (auth.uid() = user_id);

-- Tier history: Users can only access their own history
CREATE POLICY "Users can view own tier history" ON tier_history FOR SELECT USING (auth.uid() = user_id);
```

### Database Triggers

```sql
-- Auto-update updated_at timestamp on profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Default Categories

The system ships with 6 default categories:
1. **Health** - Gym, boxing, dance, sports
2. **Learning** - Reading, courses, languages
3. **Creative** - Writing, video editing, music
4. **Leisure** - Intentional rest (gaming, hobbies)
5. **Project** - Side projects, building things
6. **Career** - Job search, certifications, networking

**Important**: Empty categories (no tasks scheduled) are excluded from weekly evaluation - no penalty for life phases where certain areas aren't relevant.

## Critical UX Principles

1. **One-tap task logging**: Tap task name → marked complete → done. No modals, no duration input, no confirmation dialogs. System trusts self-reported completion.

2. **Undo within same day**: Allow immediate undo (tap again or 3-second toast), but no retroactive editing of past days.

3. **No mid-week plan adjustments**: This is a deliberate constraint. Users commit Monday and live with their goals. Bad weeks are absorbed by the 3-week tier buffer. Prevents the pattern of lowering goals every Wednesday.

4. **"Repeat Last Week" should be one tap**: Most common flow - minimize friction for recurring weekly routines.

## Key Business Rules

- Each category must hit ≥50% completion for a "clean week" (affects tier promotion eligibility)
- Week starts Monday and ends Sunday
- 4 break weeks per year allowed (clock pauses, doesn't reset tier progress)
- First-time users must create a plan before accessing the dashboard
- Single active plan per user at a time

## Phase 1 Scope

**Included**:
- Core 5 screens (Login/Register, Dashboard, Planning, Review, Profile)
- Supabase backend (PostgreSQL database + Auth)
- Email/password authentication (social logins ready but optional)
- Multi-device sync out of the box
- Task logging with one-tap completion
- Weekly scoring and tier system (0-10)
- Repeat-last-week feature
- PWA for installability and asset caching
- Row-level security for data isolation

**Excluded (Deferred to Phase 2)**:
- Social logins (Google, GitHub) - infrastructure ready, just needs UI
- Native mobile app (testing PWA first)
- Push notifications (will use in-app prompts only)
- Offline-first with local caching
- Social features / leaderboards
- Reward payouts (5-year milestone system)
- Project tracking layer
- Advanced analytics dashboard and data export

## Development Priority

When implementing features, prioritize in this order:
1. **Core user flows**: Login → Planning → Dashboard logging → Sunday review
2. **Data integrity**: Score calculation accuracy and tier movement logic
3. **Friction reduction**: One-tap interactions, sensible defaults, "Repeat Last Week"
4. **Visual feedback**: Clear progress indicators (dots for task completion, percentage bars for categories)

## Important Implementation Notes

### Supabase Client Setup

```typescript
// src/app/core/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );
  }

  get client() {
    return this.supabase;
  }

  // Helper to get current user
  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }
}
```

### Supabase Query Patterns

**Authentication**:
```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: { name: 'John Doe' }  // Stored in raw_user_meta_data
  }
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Sign out
await supabase.auth.signOut();

// Social login (Google)
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google'
});
```

**Data queries** (automatic RLS applies current user):
```typescript
// Get current user's active plan
const { data: activePlan } = await supabase
  .from('weekly_plans')
  .select('*')
  .eq('status', 'active')
  .single();  // RLS automatically filters by user_id

// Get all tasks for a plan with category info (JOIN)
const { data: tasks } = await supabase
  .from('planned_tasks')
  .select(`
    *,
    category:categories(name, display_order)
  `)
  .eq('plan_id', planId)
  .order('category_id');

// Count completed tasks for today
const today = new Date().toISOString().split('T')[0];
const { count } = await supabase
  .from('daily_logs')
  .select('*', { count: 'exact', head: true })
  .eq('log_date', today);
```

**Insert/Update operations**:
```typescript
// Insert a new task log (with transaction-like behavior)
const { data: log, error } = await supabase
  .from('daily_logs')
  .insert({
    planned_task_id: taskId,
    user_id: userId,
    log_date: today
  })
  .select()
  .single();

// Increment completed count using RPC (Postgres function)
await supabase.rpc('increment_task_count', { task_id: taskId });

// Or do it with a Postgres function:
/*
CREATE OR REPLACE FUNCTION increment_task_count(task_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE planned_tasks
  SET completed_count = completed_count + 1
  WHERE id = task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/
```

**Real-time subscriptions** (optional for live updates):
```typescript
// Listen for new task logs in real-time
const subscription = supabase
  .channel('daily-logs')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'daily_logs',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('New log created:', payload.new);
      // Update UI
    }
  )
  .subscribe();
```

### Authentication Guards

```typescript
// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const user = await supabase.getCurrentUser();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
```

### Environment Configuration

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseAnonKey: 'your-anon-key-here'
};

// Never commit the actual keys to git!
// Add environment.ts to .gitignore and use environment.example.ts as template
```

### PWA Considerations

- Service worker caches app assets (HTML, CSS, JS) for offline use
- Data requires internet connection (Supabase is server-side)
- For offline-first, consider adding IndexedDB cache layer in Phase 2
- PWA manifest allows "Add to Home Screen" on mobile

### Security Notes

- **Row-Level Security (RLS)** automatically enforces data isolation
- `auth.uid()` in policies ensures users only access their own data
- Anon key is safe to expose (limited by RLS policies)
- Never use service_role key in client-side code
- Supabase handles password hashing (bcrypt) automatically
- Session tokens stored in localStorage by Supabase client

## Reference Documents

### System Specification
The complete system specification is in `quota_life_planning_document.md`. Consult this for:
- Detailed user flows and screen mockups
- Original Firebase schema (adapted to PostgreSQL/Supabase in this file)
- Notification schedule (deferred to Phase 2)
- Scoring formula edge cases and examples
- Future features (reward system, project tracking, local visibility)

### Supabase Database Operations
**📚 See `frontend/lazy-habbit-app/docs/SUPABASE.md`** for comprehensive guide on:
- **MCP Server Setup** - Authenticate and use Supabase MCP tools
- **Running Migrations** - Create and apply database migrations
- **Executing SQL Queries** - Safe query execution patterns
- **Common Operations** - Add columns, create tables, backfill data, functions
- **Best Practices** - RLS policies, indexing, idempotent migrations
- **Troubleshooting** - Common issues and debugging queries
- **Quick Reference** - MCP commands and SQL snippets

**Use this guide when:**
- Creating new database migrations
- Running SQL queries via MCP
- Adding tables, columns, or constraints
- Setting up RLS policies
- Debugging database issues

## Getting Started Checklist

1. **Create Supabase project**:
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Copy project URL and anon key to `environment.ts`

2. **Run database migrations**:
   - See `frontend/lazy-habbit-app/docs/SUPABASE.md` for detailed migration guide
   - Use Supabase MCP via `/mcp` command in Claude Code
   - Or run migrations in Supabase SQL Editor
   - Verify tables and RLS policies are created

3. **Setup Angular project**:
   ```bash
   ng new lazy-habbit-app --standalone
   cd lazy-habbit-app
   npm install @supabase/supabase-js
   ng add @angular/pwa
   ```

4. **Create default categories** (run after first user signup):
   ```sql
   INSERT INTO categories (user_id, name, display_order) VALUES
   (auth.uid(), 'Health', 1),
   (auth.uid(), 'Learning', 2),
   (auth.uid(), 'Creative', 3),
   (auth.uid(), 'Leisure', 4),
   (auth.uid(), 'Project', 5),
   (auth.uid(), 'Career', 6);
   ```

5. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   ng build --configuration production
   vercel --prod
   ```
- where ever possible use angular cli to generate file rather than creating it yourself