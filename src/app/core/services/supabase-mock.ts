import { Injectable } from '@angular/core';
import { User } from '@supabase/supabase-js';

/**
 * Mock Supabase Service for local development without external API calls.
 * Uses localStorage to simulate database operations.
 */
@Injectable({
  providedIn: 'root',
})
export class MockSupabaseService {
  private readonly STORAGE_PREFIX = 'mock_supabase_';
  private authCallbacks: ((user: User | null) => void)[] = [];

  constructor() {
    this.initializeMockData();
  }

  /**
   * Returns a mock client that mimics Supabase client API
   */
  get client() {
    return {
      auth: {
        signUp: this.signUp.bind(this),
        signInWithPassword: this.signInWithPassword.bind(this),
        signInWithOAuth: this.signInWithOAuth.bind(this),
        signOut: this.signOut.bind(this),
        getUser: this.getUser.bind(this),
        onAuthStateChange: this.onAuthStateChange.bind(this),
      },
      from: this.from.bind(this),
      rpc: this.rpc.bind(this),
    };
  }

  async getCurrentUser(): Promise<User | null> {
    const userJson = localStorage.getItem(this.STORAGE_PREFIX + 'current_user');
    return userJson ? JSON.parse(userJson) : null;
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    this.authCallbacks.push(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = this.authCallbacks.indexOf(callback);
            if (index > -1) {
              this.authCallbacks.splice(index, 1);
            }
          },
        },
      },
    };
  }

  // =============== AUTH METHODS ===============

  private async signUp(options: {
    email: string;
    password: string;
    options?: { data?: { name?: string } };
  }) {
    const { email, password, options: signUpOptions } = options;

    // Check if user already exists
    const users = this.getFromStorage<any[]>('users', []);
    const existingUser = users.find((u) => u.email === email);

    if (existingUser) {
      return {
        data: null,
        error: { message: 'User already registered', status: 400 },
      };
    }

    // Create new user
    const newUser: User = {
      id: this.generateUUID(),
      email,
      app_metadata: {},
      user_metadata: signUpOptions?.data || {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User;

    // Store user
    users.push({ ...newUser, password }); // In real app, password would be hashed
    this.setToStorage('users', users);

    // Auto-login after signup
    this.setCurrentUser(newUser);

    // Create user profile
    const profiles = this.getFromStorage<any[]>('profiles', []);
    profiles.push({
      id: newUser.id,
      email: newUser.email,
      name: signUpOptions?.data?.name || null,
      current_tier: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    this.setToStorage('profiles', profiles);

    // Create default categories for new user
    this.createDefaultCategories(newUser.id);

    return { data: { user: newUser, session: this.createMockSession(newUser) }, error: null };
  }

  private async signInWithPassword(credentials: { email: string; password: string }) {
    const { email, password } = credentials;
    const users = this.getFromStorage<any[]>('users', []);
    const user = users.find((u) => u.email === email && u.password === password);

    if (!user) {
      return {
        data: null,
        error: { message: 'Invalid login credentials', status: 400 },
      };
    }

    const { password: _, ...userWithoutPassword } = user;
    this.setCurrentUser(userWithoutPassword);

    return {
      data: { user: userWithoutPassword, session: this.createMockSession(userWithoutPassword) },
      error: null,
    };
  }

  private async signInWithOAuth(options: { provider: string; options?: any }) {
    // Mock OAuth - just create a demo user
    const mockUser: User = {
      id: this.generateUUID(),
      email: 'demo@oauth.com',
      app_metadata: {},
      user_metadata: { name: 'OAuth Demo User' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User;

    this.setCurrentUser(mockUser);

    return { data: { provider: options.provider, url: '#' }, error: null };
  }

  private async signOut() {
    localStorage.removeItem(this.STORAGE_PREFIX + 'current_user');
    this.notifyAuthChange(null);
    return { error: null };
  }

  private async getUser() {
    const user = await this.getCurrentUser();
    return { data: { user }, error: null };
  }

  // =============== DATABASE METHODS ===============

  private from(table: string) {
    return {
      select: (columns = '*') => this.select(table, columns),
      insert: (data: any) => this.insert(table, data),
      update: (data: any) => this.update(table, data),
      delete: () => this.delete(table),
      upsert: (data: any) => this.upsert(table, data),
    };
  }

  private select(table: string, columns: string) {
    const queryBuilder = {
      _table: table,
      _columns: columns,
      _filters: [] as Array<{ field: string; op: string; value: any }>,
      _order: null as { column: string; ascending: boolean } | null,
      _limit: null as number | null,
      _single: false,
      _count: false,
      _head: false,

      eq: (field: string, value: any) => {
        queryBuilder._filters.push({ field, op: 'eq', value });
        return queryBuilder;
      },

      neq: (field: string, value: any) => {
        queryBuilder._filters.push({ field, op: 'neq', value });
        return queryBuilder;
      },

      gte: (field: string, value: any) => {
        queryBuilder._filters.push({ field, op: 'gte', value });
        return queryBuilder;
      },

      lte: (field: string, value: any) => {
        queryBuilder._filters.push({ field, op: 'lte', value });
        return queryBuilder;
      },

      order: (column: string, options?: { ascending?: boolean }) => {
        queryBuilder._order = { column, ascending: options?.ascending ?? true };
        return queryBuilder;
      },

      limit: (count: number) => {
        queryBuilder._limit = count;
        return queryBuilder;
      },

      single: () => {
        queryBuilder._single = true;
        return queryBuilder;
      },

      then: async (resolve: (result: any) => void) => {
        const result = await queryBuilder.execute();
        resolve(result);
        return result;
      },

      execute: async () => {
        if (queryBuilder._count) {
          const allData = queryBuilder.getData();
          return { count: allData.length, data: null, error: null };
        }

        let data = queryBuilder.getData();

        // Apply filters
        for (const filter of queryBuilder._filters) {
          data = data.filter((item: any) => {
            const fieldValue = filter.field.includes('.')
              ? this.getNestedValue(item, filter.field)
              : item[filter.field];

            switch (filter.op) {
              case 'eq':
                return fieldValue === filter.value;
              case 'neq':
                return fieldValue !== filter.value;
              case 'gte':
                return fieldValue >= filter.value;
              case 'lte':
                return fieldValue <= filter.value;
              default:
                return true;
            }
          });
        }

        // Apply ordering
        if (queryBuilder._order) {
          const { column, ascending } = queryBuilder._order;
          data.sort((a: any, b: any) => {
            const aVal = a[column];
            const bVal = b[column];
            if (aVal < bVal) return ascending ? -1 : 1;
            if (aVal > bVal) return ascending ? 1 : -1;
            return 0;
          });
        }

        // Apply limit
        if (queryBuilder._limit) {
          data = data.slice(0, queryBuilder._limit);
        }

        // Return single or array
        if (queryBuilder._single) {
          return { data: data[0] || null, error: data[0] ? null : { message: 'No rows found' } };
        }

        return { data, error: null };
      },

      getData: () => {
        const currentUser = JSON.parse(
          localStorage.getItem(this.STORAGE_PREFIX + 'current_user') || 'null'
        );
        const userId = currentUser?.id;

        let allData = this.getFromStorage<any[]>(queryBuilder._table, []);

        // Auto-filter by user_id if current user exists (simulates RLS)
        if (userId && allData.length > 0 && 'user_id' in allData[0]) {
          allData = allData.filter((item) => item.user_id === userId);
        }

        return allData;
      },
    };

    // Add count support
    const originalSelect = queryBuilder;
    (originalSelect as any).count = (type: string, options?: { head?: boolean }) => {
      queryBuilder._count = true;
      queryBuilder._head = options?.head || false;
      return queryBuilder;
    };

    return queryBuilder;
  }

  private insert(table: string, data: any) {
    const self = this;
    const insertBuilder = {
      _data: Array.isArray(data) ? data : [data],

      select: function() {
        return {
          single: function() {
            return insertBuilder.execute();
          },
          then: async function(resolve: (result: any) => void) {
            const result = await insertBuilder.execute();
            resolve(result);
            return result;
          },
          execute: async function() {
            return insertBuilder.execute();
          },
        };
      },

      then: async function(resolve: (result: any) => void) {
        const result = await insertBuilder.execute();
        resolve(result);
        return result;
      },

      execute: async function() {
        const currentUser = await self.getCurrentUser();
        const allData = self.getFromStorage<any[]>(table, []);

        const newRecords = insertBuilder._data.map((record: any) => ({
          id: record.id || self.generateId(),
          ...record,
          user_id: record.user_id || currentUser?.id,
          created_at: record.created_at || new Date().toISOString(),
        }));

        allData.push(...newRecords);
        self.setToStorage(table, allData);

        return {
          data: newRecords.length === 1 ? newRecords[0] : newRecords,
          error: null,
        };
      },
    };

    return insertBuilder;
  }

  private update(table: string, updateData: any) {
    const self = this;
    const updateBuilder = {
      _updateData: updateData,
      _filters: [] as Array<{ field: string; value: any }>,

      eq: function(field: string, value: any) {
        updateBuilder._filters.push({ field, value });
        return updateBuilder;
      },

      then: async function(resolve: (result: any) => void) {
        const result = await updateBuilder.execute();
        resolve(result);
        return result;
      },

      execute: async function() {
        const allData = self.getFromStorage<any[]>(table, []);
        let updated = 0;

        const newData = allData.map((item) => {
          let matches = true;
          for (const filter of updateBuilder._filters) {
            if (item[filter.field] !== filter.value) {
              matches = false;
              break;
            }
          }

          if (matches) {
            updated++;
            return {
              ...item,
              ...updateBuilder._updateData,
              updated_at: new Date().toISOString(),
            };
          }
          return item;
        });

        self.setToStorage(table, newData);
        return { data: null, error: null, count: updated };
      },
    };

    return updateBuilder;
  }

  private delete(table: string) {
    const self = this;
    const deleteBuilder = {
      _filters: [] as Array<{ field: string; value: any }>,

      eq: function(field: string, value: any) {
        deleteBuilder._filters.push({ field, value });
        return deleteBuilder;
      },

      then: async function(resolve: (result: any) => void) {
        const result = await deleteBuilder.execute();
        resolve(result);
        return result;
      },

      execute: async function() {
        const allData = self.getFromStorage<any[]>(table, []);

        const newData = allData.filter((item) => {
          for (const filter of deleteBuilder._filters) {
            if (item[filter.field] === filter.value) {
              return false; // Exclude this item
            }
          }
          return true;
        });

        self.setToStorage(table, newData);
        return { data: null, error: null };
      },
    };

    return deleteBuilder;
  }

  private upsert(table: string, data: any) {
    // For simplicity, just do insert
    return this.insert(table, data);
  }

  // =============== RPC (Postgres Functions) ===============

  private async rpc(functionName: string, params: any) {
    // Mock common RPC functions
    switch (functionName) {
      case 'increment_task_count':
        return this.incrementTaskCount(params.task_id);
      case 'decrement_task_count':
        return this.decrementTaskCount(params.task_id);
      default:
        console.warn(`Mock RPC function "${functionName}" not implemented`);
        return { data: null, error: null };
    }
  }

  private async incrementTaskCount(taskId: number) {
    const tasks = this.getFromStorage<any[]>('planned_tasks', []);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      task.completed_count = (task.completed_count || 0) + 1;
      this.setToStorage('planned_tasks', tasks);
    }
    return { data: null, error: null };
  }

  private async decrementTaskCount(taskId: number) {
    const tasks = this.getFromStorage<any[]>('planned_tasks', []);
    const task = tasks.find((t) => t.id === taskId);
    if (task && task.completed_count > 0) {
      task.completed_count--;
      this.setToStorage('planned_tasks', tasks);
    }
    return { data: null, error: null };
  }

  // =============== HELPER METHODS ===============

  private setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(this.STORAGE_PREFIX + 'current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem(this.STORAGE_PREFIX + 'current_user');
    }
    this.notifyAuthChange(user);
  }

  private notifyAuthChange(user: User | null) {
    this.authCallbacks.forEach((callback) => callback(user));
  }

  private createMockSession(user: User) {
    return {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      token_type: 'bearer',
      user,
    };
  }

  private getFromStorage<T>(key: string, defaultValue: T): T {
    const stored = localStorage.getItem(this.STORAGE_PREFIX + key);
    return stored ? JSON.parse(stored) : defaultValue;
  }

  private setToStorage(key: string, value: any): void {
    localStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(value));
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private generateId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private initializeMockData() {
    // Initialize empty tables if they don't exist
    const tables = [
      'users',
      'profiles',
      'categories',
      'task_templates',
      'weekly_plans',
      'planned_tasks',
      'daily_logs',
      'weekly_scores',
      'tier_history',
    ];

    tables.forEach((table) => {
      if (!localStorage.getItem(this.STORAGE_PREFIX + table)) {
        this.setToStorage(table, []);
      }
    });
  }

  private createDefaultCategories(userId: string) {
    const categories = [
      { name: 'Health', display_order: 1 },
      { name: 'Learning', display_order: 2 },
      { name: 'Creative', display_order: 3 },
      { name: 'Leisure', display_order: 4 },
      { name: 'Project', display_order: 5 },
      { name: 'Career', display_order: 6 },
    ];

    const existing = this.getFromStorage<any[]>('categories', []);
    const newCategories = categories.map((cat) => ({
      id: this.generateId(),
      user_id: userId,
      name: cat.name,
      display_order: cat.display_order,
      created_at: new Date().toISOString(),
    }));

    existing.push(...newCategories);
    this.setToStorage('categories', existing);
  }
}
