/**
 * Development utilities for managing mock localStorage data.
 * Only use in development with useMockBackend = true.
 */

const STORAGE_PREFIX = 'mock_supabase_';

/**
 * Clear all mock data from localStorage
 */
export function clearMockData(): void {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith(STORAGE_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
  console.log('✅ All mock data cleared');
}

/**
 * Export all mock data as JSON (for debugging)
 */
export function exportMockData(): Record<string, any> {
  const data: Record<string, any> = {};
  const keys = Object.keys(localStorage);

  keys.forEach((key) => {
    if (key.startsWith(STORAGE_PREFIX)) {
      const tableName = key.replace(STORAGE_PREFIX, '');
      const value = localStorage.getItem(key);
      data[tableName] = value ? JSON.parse(value) : null;
    }
  });

  console.log('📦 Mock data exported:', data);
  return data;
}

/**
 * Import mock data from JSON (for testing specific scenarios)
 */
export function importMockData(data: Record<string, any>): void {
  Object.entries(data).forEach(([tableName, tableData]) => {
    localStorage.setItem(STORAGE_PREFIX + tableName, JSON.stringify(tableData));
  });
  console.log('📥 Mock data imported');
}

/**
 * Seed mock database with sample data
 */
export function seedMockData(): void {
  // This will create a demo user with some sample tasks
  const userId = 'demo-user-id-12345';
  const now = new Date().toISOString();

  // Create demo user
  const users = [
    {
      id: userId,
      email: 'demo@example.com',
      password: 'password123',
      app_metadata: {},
      user_metadata: { name: 'Demo User' },
      aud: 'authenticated',
      created_at: now,
    },
  ];

  // Create profile
  const profiles = [
    {
      id: userId,
      email: 'demo@example.com',
      name: 'Demo User',
      current_tier: 3,
      created_at: now,
      updated_at: now,
    },
  ];

  // Create categories
  const categories = [
    { id: 1, user_id: userId, name: 'Health', display_order: 1, created_at: now },
    { id: 2, user_id: userId, name: 'Learning', display_order: 2, created_at: now },
    { id: 3, user_id: userId, name: 'Creative', display_order: 3, created_at: now },
    { id: 4, user_id: userId, name: 'Leisure', display_order: 4, created_at: now },
    { id: 5, user_id: userId, name: 'Project', display_order: 5, created_at: now },
    { id: 6, user_id: userId, name: 'Career', display_order: 6, created_at: now },
  ];

  // Create task templates
  const taskTemplates = [
    {
      id: 1,
      user_id: userId,
      category_id: 1,
      name: 'Gym',
      duration_minutes: 60,
      weekly_frequency: 3,
      is_active: true,
      created_at: now,
    },
    {
      id: 2,
      user_id: userId,
      category_id: 1,
      name: 'Running',
      duration_minutes: 30,
      weekly_frequency: 2,
      is_active: true,
      created_at: now,
    },
    {
      id: 3,
      user_id: userId,
      category_id: 2,
      name: 'Reading',
      duration_minutes: 45,
      weekly_frequency: 5,
      is_active: true,
      created_at: now,
    },
    {
      id: 4,
      user_id: userId,
      category_id: 3,
      name: 'Writing',
      duration_minutes: 60,
      weekly_frequency: 3,
      is_active: true,
      created_at: now,
    },
  ];

  // Create active weekly plan
  const weekStart = getMonday(new Date()).toISOString().split('T')[0];
  const weeklyPlans = [
    {
      id: 1,
      user_id: userId,
      week_start_date: weekStart,
      status: 'active',
      created_at: now,
    },
  ];

  // Create planned tasks for this week
  const plannedTasks = [
    {
      id: 1,
      plan_id: 1,
      template_id: 1,
      category_id: 1,
      name: 'Gym',
      duration_minutes: 60,
      target_frequency: 3,
      completed_count: 1,
      created_at: now,
    },
    {
      id: 2,
      plan_id: 1,
      template_id: 2,
      category_id: 1,
      name: 'Running',
      duration_minutes: 30,
      target_frequency: 2,
      completed_count: 0,
      created_at: now,
    },
    {
      id: 3,
      plan_id: 1,
      template_id: 3,
      category_id: 2,
      name: 'Reading',
      duration_minutes: 45,
      target_frequency: 5,
      completed_count: 2,
      created_at: now,
    },
    {
      id: 4,
      plan_id: 1,
      template_id: 4,
      category_id: 3,
      name: 'Writing',
      duration_minutes: 60,
      target_frequency: 3,
      completed_count: 1,
      created_at: now,
    },
  ];

  // Create some daily logs
  const dailyLogs = [
    {
      id: 1,
      planned_task_id: 1,
      user_id: userId,
      log_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
      logged_at: now,
    },
    {
      id: 2,
      planned_task_id: 3,
      user_id: userId,
      log_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      logged_at: now,
    },
    {
      id: 3,
      planned_task_id: 3,
      user_id: userId,
      log_date: new Date().toISOString().split('T')[0], // Today
      logged_at: now,
    },
    {
      id: 4,
      planned_task_id: 4,
      user_id: userId,
      log_date: new Date().toISOString().split('T')[0],
      logged_at: now,
    },
  ];

  // Store all data
  localStorage.setItem(STORAGE_PREFIX + 'users', JSON.stringify(users));
  localStorage.setItem(STORAGE_PREFIX + 'profiles', JSON.stringify(profiles));
  localStorage.setItem(STORAGE_PREFIX + 'categories', JSON.stringify(categories));
  localStorage.setItem(STORAGE_PREFIX + 'task_templates', JSON.stringify(taskTemplates));
  localStorage.setItem(STORAGE_PREFIX + 'weekly_plans', JSON.stringify(weeklyPlans));
  localStorage.setItem(STORAGE_PREFIX + 'planned_tasks', JSON.stringify(plannedTasks));
  localStorage.setItem(STORAGE_PREFIX + 'daily_logs', JSON.stringify(dailyLogs));
  localStorage.setItem(STORAGE_PREFIX + 'weekly_scores', JSON.stringify([]));
  localStorage.setItem(STORAGE_PREFIX + 'tier_history', JSON.stringify([]));

  // Set current user
  localStorage.setItem(STORAGE_PREFIX + 'current_user', JSON.stringify(users[0]));

  console.log('🌱 Mock data seeded with demo user and tasks');
  console.log('📧 Login with: demo@example.com / password123');
}

/**
 * Helper to get Monday of current week
 */
function getMonday(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(date.setDate(diff));
}

// Expose utilities on window object for browser console access
if (typeof window !== 'undefined') {
  (window as any).mockDataUtils = {
    clear: clearMockData,
    export: exportMockData,
    import: importMockData,
    seed: seedMockData,
  };
  console.log('🔧 Mock data utilities available: window.mockDataUtils');
}
