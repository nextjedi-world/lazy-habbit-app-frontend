# Supabase Integration Skill

## Description
Provides patterns and best practices for integrating Supabase (PostgreSQL + Auth) with Angular applications. Covers authentication, database queries, real-time subscriptions, Row-Level Security (RLS), and error handling.

## When to Use This Skill

Use this skill when you need to:
- Set up Supabase client in Angular
- Implement authentication flows
- Perform database CRUD operations
- Handle real-time subscriptions
- Work with RLS policies
- Generate TypeScript types from database schema

## Setup

### Step 1: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 2: Configure Environment

```typescript
// src/environments/environment.ts (DO NOT COMMIT)
export const environment = {
  production: false,
  supabaseUrl: 'https://xxxxx.supabase.co',
  supabaseAnonKey: 'your-anon-key-here'
};

// src/environments/environment.example.ts (COMMIT THIS)
export const environment = {
  production: false,
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
};
```

Add to `.gitignore`:
```
src/environments/environment.ts
src/environments/environment.prod.ts
```

### Step 3: Create Supabase Service

```bash
ng generate service core/services/supabase
```

```typescript
// core/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Database } from '../models/database.types';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient<Database>;

  constructor() {
    this.supabase = createClient<Database>(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );
  }

  get client() {
    return this.supabase;
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null);
    });
  }
}
```

## Authentication Patterns

### Auth Service

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  private _user = signal<User | null>(null);
  readonly user = this._user.asReadonly();

  private _loading = signal(true);
  readonly loading = this._loading.asReadonly();

  readonly isAuthenticated = computed(() => this._user() !== null);

  constructor() {
    this.initAuth();
  }

  private async initAuth() {
    // Get current session
    const user = await this.supabase.getCurrentUser();
    this._user.set(user);
    this._loading.set(false);

    // Listen to auth changes
    this.supabase.onAuthStateChange(user => {
      this._user.set(user);

      if (!user) {
        this.router.navigate(['/auth/login']);
      }
    });
  }

  async signUp(email: string, password: string, name: string) {
    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        data: { name }  // Stored in raw_user_meta_data
      }
    });

    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    this._user.set(data.user);
    return data;
  }

  async signInWithGoogle() {
    const { data, error } = await this.supabase.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.client.auth.signOut();
    if (error) throw error;

    this._user.set(null);
    this.router.navigate(['/auth/login']);
  }

  async resetPassword(email: string) {
    const { error } = await this.supabase.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    if (error) throw error;
  }

  async updatePassword(newPassword: string) {
    const { error } = await this.supabase.client.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
  }
}
```

### Auth Guard

```typescript
// core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.loading()) {
    // Wait for auth to initialize
    return new Promise<boolean>(resolve => {
      const interval = setInterval(() => {
        if (!authService.loading()) {
          clearInterval(interval);
          resolve(authService.isAuthenticated());
        }
      }, 100);
    });
  }

  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  return true;
};

// Usage in routes
const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component'),
    canActivate: [authGuard]
  }
];
```

## Database Query Patterns

### Basic CRUD Operations

```typescript
// Read (Select)
const { data, error } = await this.supabase.client
  .from('tasks')
  .select('*')
  .eq('user_id', userId);

if (error) throw error;

// Read with joins
const { data, error } = await this.supabase.client
  .from('planned_tasks')
  .select(`
    *,
    category:categories(id, name),
    template:task_templates(*)
  `)
  .eq('plan_id', planId);

// Read single row
const { data, error } = await this.supabase.client
  .from('weekly_plans')
  .select('*')
  .eq('id', planId)
  .single();

// Create (Insert)
const { data, error } = await this.supabase.client
  .from('tasks')
  .insert({
    name: 'New Task',
    duration_minutes: 60,
    user_id: userId
  })
  .select()
  .single();

// Update
const { error } = await this.supabase.client
  .from('tasks')
  .update({ name: 'Updated Name' })
  .eq('id', taskId);

// Delete
const { error } = await this.supabase.client
  .from('tasks')
  .delete()
  .eq('id', taskId);

// Upsert (Insert or Update)
const { data, error } = await this.supabase.client
  .from('weekly_scores')
  .upsert({
    user_id: userId,
    week_start_date: weekStart,
    overall_score: 0.85
  }, {
    onConflict: 'user_id,week_start_date'
  });
```

### Complex Queries

```typescript
// Filter with multiple conditions
const { data, error } = await this.supabase.client
  .from('tasks')
  .select('*')
  .eq('user_id', userId)
  .gte('created_at', startDate)
  .lte('created_at', endDate)
  .order('created_at', { ascending: false })
  .limit(10);

// Count records
const { count, error } = await this.supabase.client
  .from('daily_logs')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
  .eq('log_date', today);

// Full-text search
const { data, error } = await this.supabase.client
  .from('tasks')
  .select('*')
  .textSearch('name', searchTerm);

// Range query
const { data, error } = await this.supabase.client
  .from('weekly_scores')
  .select('*')
  .eq('user_id', userId)
  .gte('week_start_date', threeWeeksAgo)
  .lte('week_start_date', today);
```

### RPC (Stored Procedures)

```sql
-- Create Postgres function
CREATE OR REPLACE FUNCTION increment_task_count(task_id BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE planned_tasks
  SET completed_count = completed_count + 1
  WHERE id = task_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

```typescript
// Call from Angular
await this.supabase.client.rpc('increment_task_count', {
  task_id: taskId
});

// RPC with return value
const { data, error } = await this.supabase.client.rpc('calculate_weekly_score', {
  plan_id: planId
});
```

## Real-Time Subscriptions

### Subscribe to Table Changes

```typescript
import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class TaskRealtimeService implements OnDestroy {
  private readonly supabase = inject(SupabaseService);
  private channel?: RealtimeChannel;

  private _tasks = signal<Task[]>([]);
  readonly tasks = this._tasks.asReadonly();

  subscribeToTasks(userId: string) {
    this.channel = this.supabase.client
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',  // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'planned_tasks',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Change received:', payload);

          switch (payload.eventType) {
            case 'INSERT':
              this._tasks.update(current => [...current, payload.new as Task]);
              break;

            case 'UPDATE':
              this._tasks.update(current =>
                current.map(t => t.id === payload.new.id ? payload.new as Task : t)
              );
              break;

            case 'DELETE':
              this._tasks.update(current =>
                current.filter(t => t.id !== payload.old.id)
              );
              break;
          }
        }
      )
      .subscribe();
  }

  ngOnDestroy() {
    if (this.channel) {
      this.supabase.client.removeChannel(this.channel);
    }
  }
}
```

## Type Generation

### Generate TypeScript Types from Database

```bash
# Install Supabase CLI
npm install -D supabase

# Generate types
npx supabase gen types typescript --project-id your-project-id > src/app/core/models/database.types.ts
```

### Use Generated Types

```typescript
import { Database } from '../models/database.types';

type Task = Database['public']['Tables']['planned_tasks']['Row'];
type TaskInsert = Database['public']['Tables']['planned_tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['planned_tasks']['Update'];

// Use with Supabase client
const supabase = createClient<Database>(url, key);

// Fully typed queries
const { data, error } = await supabase
  .from('planned_tasks')
  .select('*');
// data is typed as Task[]
```

## Error Handling

### Standard Error Pattern

```typescript
async loadData(): Promise<void> {
  this._loading.set(true);
  this._error.set(null);

  try {
    const { data, error } = await this.supabase.client
      .from('table_name')
      .select('*');

    if (error) {
      // Supabase error
      console.error('Supabase error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    this._data.set(data);
  } catch (error) {
    // Handle both Supabase and network errors
    const message = error instanceof Error
      ? error.message
      : 'An unexpected error occurred';

    this._error.set(message);
    throw error;
  } finally {
    this._loading.set(false);
  }
}
```

### Error Codes

```typescript
// Handle specific error codes
const { error } = await this.supabase.client
  .from('daily_logs')
  .insert({ planned_task_id: taskId, user_id: userId, log_date: today });

if (error) {
  // Unique constraint violation (already logged today)
  if (error.code === '23505') {
    throw new Error('Task already completed today');
  }

  // Foreign key violation
  if (error.code === '23503') {
    throw new Error('Invalid task or user reference');
  }

  // Generic error
  throw new Error(`Failed to log task: ${error.message}`);
}
```

## Row-Level Security (RLS)

### Understanding RLS

Row-Level Security automatically filters database queries based on the authenticated user. The `auth.uid()` function in policies returns the current user's ID.

### Example Policies

```sql
-- Users can only see their own data
CREATE POLICY "Users can view own tasks"
  ON planned_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON planned_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON planned_tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON planned_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Complex policy: Users can only access tasks from their own plans
CREATE POLICY "Users can manage own planned tasks"
  ON planned_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM weekly_plans
      WHERE id = plan_id AND user_id = auth.uid()
    )
  );
```

### Working with RLS in Angular

```typescript
// RLS automatically applies - no need to filter by user_id manually
const { data, error } = await this.supabase.client
  .from('planned_tasks')
  .select('*');
// Returns only tasks for the authenticated user

// When inserting, always include user_id
const userId = (await this.supabase.getCurrentUser())?.id;
if (!userId) throw new Error('Not authenticated');

const { error } = await this.supabase.client
  .from('planned_tasks')
  .insert({
    name: 'Task',
    user_id: userId  // Required by RLS policy
  });
```

## Best Practices

### 1. Always Check Authentication

```typescript
async performAction() {
  const user = await this.supabase.getCurrentUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Proceed with action
}
```

### 2. Use Optimistic Updates

```typescript
async completeTask(taskId: number) {
  // Update UI immediately
  this._tasks.update(tasks =>
    tasks.map(t => t.id === taskId ? { ...t, isCompleted: true } : t)
  );

  try {
    // Persist to database
    const { error } = await this.supabase.client
      .from('tasks')
      .update({ is_completed: true })
      .eq('id', taskId);

    if (error) throw error;
  } catch (error) {
    // Revert on error
    this._tasks.update(tasks =>
      tasks.map(t => t.id === taskId ? { ...t, isCompleted: false } : t)
    );
    throw error;
  }
}
```

### 3. Batch Operations

```typescript
// Insert multiple rows at once
const { data, error } = await this.supabase.client
  .from('daily_logs')
  .insert([
    { planned_task_id: 1, user_id: userId, log_date: today },
    { planned_task_id: 2, user_id: userId, log_date: today },
    { planned_task_id: 3, user_id: userId, log_date: today }
  ]);
```

### 4. Use Transactions (via RPC)

```sql
-- Create atomic transaction
CREATE OR REPLACE FUNCTION complete_weekly_plan(plan_id BIGINT)
RETURNS VOID AS $$
BEGIN
  -- Update plan status
  UPDATE weekly_plans
  SET status = 'completed'
  WHERE id = plan_id;

  -- Calculate and insert score
  INSERT INTO weekly_scores (user_id, plan_id, overall_score)
  SELECT user_id, id, calculate_score(id)
  FROM weekly_plans
  WHERE id = plan_id;

  -- Update tier if needed
  -- ... more operations
END;
$$ LANGUAGE plpgsql;
```

```typescript
// Call from Angular
await this.supabase.client.rpc('complete_weekly_plan', {
  plan_id: planId
});
```

## Checklist

- [ ] Supabase service created and configured
- [ ] Environment variables set (not committed)
- [ ] Authentication service implemented
- [ ] Auth guard protecting routes
- [ ] TypeScript types generated from database
- [ ] All queries have error handling
- [ ] Loading states managed
- [ ] RLS policies understood and tested
- [ ] Optimistic updates for better UX
- [ ] Real-time subscriptions cleaned up (ngOnDestroy)
- [ ] User authentication checked before operations

## Resources

- **Supabase Docs**: https://supabase.com/docs
- **Supabase JS Client**: https://supabase.com/docs/reference/javascript
- **Row-Level Security**: https://supabase.com/docs/guides/auth/row-level-security

---

**Remember**: Always handle errors, check authentication, and understand RLS policies. The anon key is safe to expose - security is enforced by RLS at the database level.
