# Angular Service Generation Skill

## Description
Generates Angular services with signal-based state management, proper dependency injection, error handling, and Supabase integration patterns. Services are tree-shakable singletons that manage application state and business logic.

## When to Use This Skill

Use this skill when you need to create:
- Data services (CRUD operations with Supabase)
- State management services
- Utility services (calculations, formatting, etc.)
- Authentication services
- API client services

## Instructions

### Step 1: Generate Service with Angular CLI

```bash
# For core services (singleton, app-wide)
ng generate service core/services/[name]

# Examples:
ng generate service core/services/task
ng generate service core/services/auth
ng generate service core/services/score
```

### Step 2: Standard Service Structure

```typescript
import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DataType } from '../models/data.model';

@Injectable({
  providedIn: 'root'  // Tree-shakable singleton
})
export class DataService {
  // 1. Dependencies
  private readonly supabase = inject(SupabaseService);

  // 2. Private state (signals)
  private _data = signal<DataType[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // 3. Public readonly state
  readonly data = this._data.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // 4. Computed values
  readonly hasData = computed(() => this._data().length > 0);
  readonly isEmpty = computed(() => !this._loading() && this._data().length === 0);

  // 5. Public methods (async for Supabase operations)
  async loadData(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const { data, error } = await this.supabase.client
        .from('table_name')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      this._data.set(data || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load data';
      this._error.set(message);
      console.error('Load error:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  async create(item: Omit<DataType, 'id' | 'created_at'>): Promise<DataType> {
    const userId = (await this.supabase.getCurrentUser())?.id;
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await this.supabase.client
      .from('table_name')
      .insert({ ...item, user_id: userId })
      .select()
      .single();

    if (error) throw error;

    // Update local state optimistically
    this._data.update(current => [...current, data]);

    return data;
  }

  async update(id: number, updates: Partial<DataType>): Promise<void> {
    const { error } = await this.supabase.client
      .from('table_name')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    // Update local state
    this._data.update(current =>
      current.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabase.client
      .from('table_name')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Update local state
    this._data.update(current => current.filter(item => item.id !== id));
  }

  // 6. Helper methods
  getById(id: number): DataType | undefined {
    return this._data().find(item => item.id === id);
  }

  // 7. Reset/clear methods
  reset(): void {
    this._data.set([]);
    this._loading.set(false);
    this._error.set(null);
  }
}
```

### Step 3: Project-Specific Service Examples

#### Task Service (Lazy Habbit App)

```typescript
import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { PlannedTask } from '../models/plan.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly supabase = inject(SupabaseService);

  private _tasks = signal<PlannedTask[]>([]);
  readonly tasks = this._tasks.asReadonly();

  // Computed: Group tasks by category
  readonly tasksByCategory = computed(() => {
    const tasks = this._tasks();
    const grouped = new Map<number, PlannedTask[]>();

    tasks.forEach(task => {
      const categoryTasks = grouped.get(task.categoryId) || [];
      categoryTasks.push(task);
      grouped.set(task.categoryId, categoryTasks);
    });

    return grouped;
  });

  // Computed: Completed tasks count
  readonly completedCount = computed(() =>
    this._tasks().filter(t => t.completedCount >= t.targetFrequency).length
  );

  async loadTasksForPlan(planId: number): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('planned_tasks')
      .select(`
        *,
        category:categories(id, name, display_order)
      `)
      .eq('plan_id', planId)
      .order('category_id');

    if (error) throw error;
    this._tasks.set(data || []);
  }

  async completeTask(taskId: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const userId = (await this.supabase.getCurrentUser())?.id;
    if (!userId) throw new Error('User not authenticated');

    // Insert daily log
    const { error: logError } = await this.supabase.client
      .from('daily_logs')
      .insert({
        planned_task_id: taskId,
        user_id: userId,
        log_date: today
      });

    if (logError) {
      // Check if already logged today
      if (logError.code === '23505') {
        throw new Error('Task already completed today');
      }
      throw logError;
    }

    // Increment completed count using RPC
    await this.supabase.client.rpc('increment_task_count', { task_id: taskId });

    // Update local state
    this._tasks.update(tasks =>
      tasks.map(t =>
        t.id === taskId
          ? { ...t, completedCount: t.completedCount + 1 }
          : t
      )
    );
  }

  async undoTaskCompletion(taskId: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const userId = (await this.supabase.getCurrentUser())?.id;
    if (!userId) throw new Error('User not authenticated');

    // Delete today's log
    const { error } = await this.supabase.client
      .from('daily_logs')
      .delete()
      .eq('planned_task_id', taskId)
      .eq('user_id', userId)
      .eq('log_date', today);

    if (error) throw error;

    // Decrement count
    await this.supabase.client.rpc('decrement_task_count', { task_id: taskId });

    // Update local state
    this._tasks.update(tasks =>
      tasks.map(t =>
        t.id === taskId
          ? { ...t, completedCount: Math.max(0, t.completedCount - 1) }
          : t
      )
    );
  }
}
```

#### Score Service (Lazy Habbit App)

```typescript
import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { WeeklyScore, CategoryScore } from '../models/score.model';

@Injectable({
  providedIn: 'root'
})
export class ScoreService {
  private readonly supabase = inject(SupabaseService);

  private _currentScore = signal<WeeklyScore | null>(null);
  readonly currentScore = this._currentScore.asReadonly();

  // Computed: Overall percentage
  readonly overallPercentage = computed(() => {
    const score = this._currentScore();
    return score ? Math.round(score.overallScore * 100) : 0;
  });

  // Computed: Is clean week (all categories >= 50%)
  readonly isCleanWeek = computed(() => {
    const score = this._currentScore();
    if (!score || !score.categoryScores) return false;

    return Object.values(score.categoryScores).every(
      (catScore: CategoryScore) => catScore.percentage >= 0.5
    );
  });

  async calculateScore(planId: number): Promise<WeeklyScore> {
    // Fetch planned tasks with completion data
    const { data: tasks, error } = await this.supabase.client
      .from('planned_tasks')
      .select(`
        *,
        category:categories(id, name),
        logs:daily_logs(count)
      `)
      .eq('plan_id', planId);

    if (error) throw error;

    // Calculate hour and task scores
    let totalHoursScheduled = 0;
    let totalHoursCompleted = 0;
    let totalTasksScheduled = 0;
    let totalTasksCompleted = 0;

    const categoryScores: Record<number, CategoryScore> = {};

    tasks.forEach(task => {
      const hoursScheduled = (task.durationMinutes / 60) * task.targetFrequency;
      const hoursCompleted = (task.durationMinutes / 60) * task.completedCount;

      totalHoursScheduled += hoursScheduled;
      totalHoursCompleted += hoursCompleted;
      totalTasksScheduled += task.targetFrequency;
      totalTasksCompleted += task.completedCount;

      // Per-category tracking
      const catId = task.categoryId;
      if (!categoryScores[catId]) {
        categoryScores[catId] = {
          categoryId: catId,
          categoryName: task.category.name,
          hoursScheduled: 0,
          hoursCompleted: 0,
          tasksScheduled: 0,
          tasksCompleted: 0,
          percentage: 0
        };
      }

      categoryScores[catId].hoursScheduled += hoursScheduled;
      categoryScores[catId].hoursCompleted += hoursCompleted;
      categoryScores[catId].tasksScheduled += task.targetFrequency;
      categoryScores[catId].tasksCompleted += task.completedCount;
    });

    // Calculate percentages
    Object.values(categoryScores).forEach(cat => {
      const hourScore = cat.hoursScheduled > 0
        ? cat.hoursCompleted / cat.hoursScheduled
        : 0;
      const taskScore = cat.tasksScheduled > 0
        ? cat.tasksCompleted / cat.tasksScheduled
        : 0;

      cat.percentage = (hourScore + taskScore) / 2;
    });

    const hourScore = totalHoursScheduled > 0
      ? totalHoursCompleted / totalHoursScheduled
      : 0;

    const taskScore = totalTasksScheduled > 0
      ? totalTasksCompleted / totalTasksScheduled
      : 0;

    const overallScore = (hourScore + taskScore) / 2;

    const weeklyScore: WeeklyScore = {
      hourScore,
      taskScore,
      overallScore,
      categoryScores,
      isClean: this.checkCleanWeek(categoryScores)
    };

    this._currentScore.set(weeklyScore);
    return weeklyScore;
  }

  private checkCleanWeek(categoryScores: Record<number, CategoryScore>): boolean {
    return Object.values(categoryScores).every(cat => cat.percentage >= 0.5);
  }
}
```

### Step 4: Service Testing

```typescript
import { TestBed } from '@angular/core/testing';
import { DataService } from './data.service';
import { SupabaseService } from './supabase.service';

describe('DataService', () => {
  let service: DataService;
  let supabaseMock: jasmine.SpyObj<SupabaseService>;

  beforeEach(() => {
    // Create Supabase mock
    supabaseMock = jasmine.createSpyObj('SupabaseService', ['client', 'getCurrentUser']);

    TestBed.configureTestingModule({
      providers: [
        DataService,
        { provide: SupabaseService, useValue: supabaseMock }
      ]
    });

    service = TestBed.inject(DataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadData', () => {
    it('should load data and update signal', async () => {
      const mockData = [{ id: 1, name: 'Test' }];
      supabaseMock.client.from.and.returnValue({
        select: () => ({
          order: () => Promise.resolve({ data: mockData, error: null })
        })
      } as any);

      await service.loadData();

      expect(service.data()).toEqual(mockData);
      expect(service.loading()).toBe(false);
    });

    it('should set error on failure', async () => {
      const mockError = new Error('Database error');
      supabaseMock.client.from.and.returnValue({
        select: () => ({
          order: () => Promise.resolve({ data: null, error: mockError })
        })
      } as any);

      await expectAsync(service.loadData()).toBeRejected();
      expect(service.error()).toBeTruthy();
    });
  });

  describe('computed values', () => {
    it('should compute hasData correctly', async () => {
      expect(service.hasData()).toBe(false);

      // Load data
      supabaseMock.client.from.and.returnValue({
        select: () => ({
          order: () => Promise.resolve({ data: [{ id: 1 }], error: null })
        })
      } as any);

      await service.loadData();
      expect(service.hasData()).toBe(true);
    });
  });
});
```

## Patterns

### State Management Service

```typescript
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _isDark = signal(false);
  readonly isDark = this._isDark.asReadonly();

  constructor() {
    // Load from localStorage
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      this._isDark.set(true);
    }
  }

  toggle(): void {
    this._isDark.update(current => !current);
    localStorage.setItem('theme', this._isDark() ? 'dark' : 'light');
  }

  setTheme(isDark: boolean): void {
    this._isDark.set(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }
}
```

### Utility Service

```typescript
@Injectable({ providedIn: 'root' })
export class DateUtilService {
  getWeekStart(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    return new Date(d.setDate(diff));
  }

  getWeekEnd(date: Date = new Date()): Date {
    const start = this.getWeekStart(date);
    return new Date(start.setDate(start.getDate() + 6));
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }
}
```

## Checklist

- [ ] Generated with Angular CLI (`ng generate service`)
- [ ] `providedIn: 'root'` for tree-shaking
- [ ] Uses signals for state management
- [ ] Exposes readonly versions of signals
- [ ] Proper error handling in async methods
- [ ] Loading states managed
- [ ] Optimistic UI updates
- [ ] Methods documented with comments
- [ ] Unit tests written
- [ ] No console.log in production code
- [ ] Supabase queries have error handling

## Resources

- **Angular Best Practices**: `frontend/context/angular-best-practices.md`
- **Supabase Integration**: `.claude/skills/supabase-integration/SKILL.md`

---

**Remember**: Services should be the single source of truth for their domain. Use signals for reactive state management.
