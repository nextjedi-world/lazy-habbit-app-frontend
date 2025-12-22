# Supabase Migrations - Lazy Habbit App

> **Quick reference for database migrations and schema management for Claude agents**

## Project Database Structure

**Project:** Lazy Habbit App
**Database:** PostgreSQL via Supabase
**Location:** `supabase/migrations/`
**MCP Server:** Supabase (authenticate with `/mcp` command)

---

## Table Structure & Relationships

```
profiles (auth.users)
├── id (UUID, PK) → References auth.users
├── email, name, current_tier (0-10)
└── created_at, updated_at

categories
├── id (BIGSERIAL, PK)
├── user_id (UUID, FK → profiles.id)
├── name, display_order
├── preset_id (TEXT) → References category-presets.ts
├── color, icon (TEXT, optional overrides)
└── created_at

task_templates (reusable tasks)
├── id (BIGSERIAL, PK)
├── user_id (UUID, FK → profiles.id)
├── category_id (BIGINT, FK → categories.id)
├── name, duration_minutes, weekly_frequency
├── is_active (BOOLEAN)
└── created_at

weekly_plans
├── id (BIGSERIAL, PK)
├── user_id (UUID, FK → profiles.id)
├── week_start_date (DATE, Monday)
├── status ('active' | 'completed')
└── created_at

planned_tasks (weekly instances)
├── id (BIGSERIAL, PK)
├── plan_id (BIGINT, FK → weekly_plans.id)
├── template_id (BIGINT, FK → task_templates.id, nullable)
├── category_id (BIGINT, FK → categories.id)
├── name, duration_minutes, target_frequency
├── completed_count (INTEGER)
└── created_at

daily_logs (task completions)
├── id (BIGSERIAL, PK)
├── planned_task_id (BIGINT, FK → planned_tasks.id)
├── user_id (UUID, FK → profiles.id)
├── log_date (DATE)
└── logged_at (TIMESTAMPTZ)

weekly_scores
├── id (BIGSERIAL, PK)
├── user_id (UUID, FK → profiles.id)
├── plan_id (BIGINT, FK → weekly_plans.id)
├── week_start_date (DATE)
├── hour_score, task_score, overall_score (DECIMAL 0-1)
├── category_scores (JSONB)
├── is_clean (BOOLEAN - all categories ≥50%)
├── tier_track ('promotion' | 'stable' | 'demotion')
└── created_at

tier_history
├── id (BIGSERIAL, PK)
├── user_id (UUID, FK → profiles.id)
├── old_tier, new_tier (INTEGER 0-10)
├── reason (TEXT)
└── changed_at (TIMESTAMPTZ)
```

**Key Relationships:**
- All tables have `user_id` FK with `ON DELETE CASCADE` (RLS enabled)
- Categories → Category Presets (app-side join via `preset_id`)
- Weekly Plans → Planned Tasks → Daily Logs (cascade delete)
- Task Templates → Planned Tasks (nullable, `ON DELETE SET NULL`)

---

## Migration Changelog

### `20251215141627_complete_schema.sql` (Initial Setup)
- Created all 8 core tables
- Enabled RLS on all tables with user-based policies
- Created indexes on foreign keys and common query columns
- Added triggers for `updated_at` on profiles
- Added `handle_new_user()` trigger for auto-profile creation

### `20251215161158_fix_profile_creation.sql`
- Fixed profile creation trigger
- Ensured profile exists before category creation

### `20251222172526_add_category_presets.sql` (Latest)
- Added `preset_id`, `color`, `icon` columns to categories
- Created index on `preset_id`
- Backfilled existing categories with preset IDs
- Added column comments for documentation

**Next Migration Number:** Run `date +%Y%m%d%H%M%S` to generate timestamp

---

## Common Operations

### Authenticate Supabase MCP
```bash
# In Claude Code
/mcp
# Confirm: "Authentication successful. Reconnected to supabase."
```

### Apply New Migration
```typescript
// 1. Create file: supabase/migrations/YYYYMMDDHHMMSS_name.sql
// 2. Apply via MCP:
await mcp__supabase__apply_migration({
  name: "descriptive_name",
  query: `-- SQL here`
});
```

### Verify Migration
```sql
-- Check columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'your_table'
ORDER BY ordinal_position;

-- Check applied migrations
await mcp__supabase__list_migrations();
```

### Query Data
```sql
-- Always use execute_sql for SELECT queries
SELECT id, name, preset_id
FROM categories
WHERE user_id = auth.uid()
ORDER BY display_order;
```

---

## Migration Template

```sql
-- ============================================================================
-- MIGRATION: Brief Description
-- ============================================================================
-- Detailed description of what this migration does and why
-- ============================================================================

-- Add columns (use IF NOT EXISTS for idempotency)
ALTER TABLE table_name
  ADD COLUMN IF NOT EXISTS column_name TYPE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column_name);

-- Backfill existing data (use WHERE column IS NULL)
UPDATE table_name
SET column_name = 'default_value'
WHERE column_name IS NULL;

-- Add constraints
ALTER TABLE table_name
  ADD CONSTRAINT constraint_name CHECK (condition);

-- Add comments
COMMENT ON COLUMN table_name.column_name IS 'Description of purpose';
```

---

## Important Notes

### Row-Level Security (RLS)
- **All tables have RLS enabled** with `auth.uid() = user_id` policies
- Users can only access their own data
- Policies: SELECT, INSERT, UPDATE, DELETE all use `auth.uid()`

### Category Presets
- **Frontend file:** `src/app/shared/constants/category-presets.ts`
- **16 presets:** 6 defaults + 9 additional + 1 Uncategorized
- **Database field:** `categories.preset_id` references preset IDs
- **Colors/Icons:** Resolved in Angular via `getCategoryWithPreset()`

### Cascade Behavior
- **Delete User** → Cascade deletes all user data (profiles, categories, plans, etc.)
- **Delete Category** → App reassigns tasks to "Uncategorized" first (handled in UserService)
- **Delete Weekly Plan** → Cascade deletes planned_tasks and daily_logs
- **Delete Task Template** → Sets `planned_tasks.template_id = NULL` (no cascade)

### Indexes
```sql
-- Existing indexes on all FK columns:
idx_categories_user_id
idx_task_templates_user_id
idx_task_templates_category_id
idx_weekly_plans_user_id
idx_weekly_plans_week_start
idx_planned_tasks_plan_id
idx_daily_logs_user_id
idx_daily_logs_date
idx_weekly_scores_user_id
idx_tier_history_user_id
idx_categories_preset_id  -- NEW (Dec 22, 2024)
```

---

## Quick MCP Commands

```typescript
// List all migrations
await mcp__supabase__list_migrations();

// List all tables
await mcp__supabase__list_tables();

// Execute SQL query
await mcp__supabase__execute_sql({
  query: `SELECT * FROM categories LIMIT 5;`
});

// Apply migration
await mcp__supabase__apply_migration({
  name: "migration_name",
  query: `ALTER TABLE ...`
});
```

---

## Standard Practices

1. **Always use `IF NOT EXISTS`** in migrations for idempotency
2. **Always add indexes** on foreign keys and frequently queried columns
3. **Always enable RLS** on new tables with user-based policies
4. **Always use `WHERE column IS NULL`** when backfilling data
5. **Never hardcode user IDs** - use `auth.uid()` or data-based WHERE clauses
6. **Always add COMMENT** to document column purposes
7. **Always test on dev branch** before production (optional for this 2-user MVP)

---

## File Paths

- **Migrations:** `supabase/migrations/*.sql`
- **Category Presets:** `src/app/shared/constants/category-presets.ts`
- **UserService CRUD:** `src/app/core/services/user.ts`
- **Database Types:** `src/app/core/models/user.model.ts`
- **Main Project Docs:** `../CLAUDE.md` (parent directory)

---

**Last Updated:** December 22, 2024
**Total Migrations:** 3
**Total Tables:** 8
