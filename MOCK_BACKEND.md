# Mock Backend Development Guide

This project includes a **fully local mock backend** that eliminates the need for Supabase during development. All data is stored in browser `localStorage`.

## Quick Start

### 1. Enable Mock Backend

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  useMockBackend: true, // ✅ Enable mock mode
  supabaseUrl: '...',
  supabaseAnonKey: '...'
};
```

### 2. Start Development Server

```bash
npm start
# or
ng serve
```

Open http://localhost:4200

### 3. Create Account or Use Demo Data

**Option A: Register New Account**
- Go to `/register`
- Create account with any email/password
- Default categories are auto-created

**Option B: Use Seeded Demo Data**
- Open browser console (F12)
- Run: `window.mockDataUtils.seed()`
- Login with: `demo@example.com` / `password123`

## Mock Data Utilities

All utilities are available in the browser console via `window.mockDataUtils`:

### Clear All Data
```javascript
window.mockDataUtils.clear()
```
Removes all mock data from localStorage.

### Seed Demo Data
```javascript
window.mockDataUtils.seed()
```
Creates a demo user with sample tasks and categories.

**Demo User:**
- Email: `demo@example.com`
- Password: `password123`
- Tier: 3
- Has active weekly plan with tasks

### Export Data (for debugging)
```javascript
const data = window.mockDataUtils.export()
console.log(data)
```
Exports all tables as JSON.

### Import Data (for testing)
```javascript
const customData = {
  users: [...],
  categories: [...],
  // ...
};
window.mockDataUtils.import(customData)
```
Imports custom test data.

## Switching Between Mock and Real Backend

### Local Development (Mock)
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  useMockBackend: true, // ✅ No external API calls
  supabaseUrl: '...',
  supabaseAnonKey: '...'
};
```

### Local Development (Real Supabase)
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  useMockBackend: false, // ✅ Connect to production Supabase
  supabaseUrl: 'https://mgifcqdadcsutrzsxmvk.supabase.co',
  supabaseAnonKey: 'your-real-key'
};
```

### Production (Always Real)
```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  useMockBackend: false, // ✅ Always false in production
  supabaseUrl: '...',
  supabaseAnonKey: '...'
};
```

## How It Works

### Architecture

```
AuthService
    ↓
SupabaseService (interface)
    ↓
┌───────────────────┐
│ useMockBackend?   │
└───────────────────┘
    ↓           ↓
   Yes         No
    ↓           ↓
MockSupabaseService  RealSupabaseService
    ↓                     ↓
localStorage          Supabase API
```

### Mock Service Features

✅ **Authentication**
- Sign up, sign in, sign out
- Password storage (not hashed, dev only!)
- OAuth simulation
- Auto-creates default categories

✅ **Database Operations**
- `.from(table).select()` with filters
- `.insert()`, `.update()`, `.delete()`
- `.eq()`, `.neq()`, `.gte()`, `.lte()` filters
- `.order()`, `.limit()`, `.single()`
- Nested queries (e.g., `category:categories(name)`)

✅ **RPC (Postgres Functions)**
- `increment_task_count`
- `decrement_task_count`

✅ **Row-Level Security Simulation**
- Automatically filters data by `user_id`
- Mimics Supabase RLS behavior

## Supported Tables

All tables from your Supabase schema:
- `users`
- `profiles`
- `categories`
- `task_templates`
- `weekly_plans`
- `planned_tasks`
- `daily_logs`
- `weekly_scores`
- `tier_history`

## Limitations

⚠️ **Mock backend limitations:**
- No server-side validation (beyond basic checks)
- Passwords stored in plain text (localStorage only!)
- No multi-tab sync (each tab has isolated state)
- No real-time subscriptions (auth state changes work)
- No Postgres constraints (foreign keys, unique constraints)
- RPC functions are limited (only task counter implemented)

## Development Workflow

### Typical Dev Session

1. **Start with mock backend**
   ```bash
   # environment.ts: useMockBackend = true
   npm start
   ```

2. **Seed demo data**
   ```javascript
   window.mockDataUtils.seed()
   ```

3. **Develop features**
   - All CRUD operations work locally
   - No network latency
   - Fast iteration

4. **Test with real backend** (before committing)
   ```typescript
   // Change environment.ts: useMockBackend = false
   // Restart server
   ```

5. **Verify production works**
   ```bash
   ng build --configuration production
   # Test build locally or deploy
   ```

### Testing Scenarios

**Test Empty State (New User)**
```javascript
window.mockDataUtils.clear()
// Register new account at /register
```

**Test Active User Flow**
```javascript
window.mockDataUtils.seed()
// Login: demo@example.com / password123
```

**Test Specific Data**
```javascript
const customData = {
  users: [{ id: '123', email: 'test@test.com', ... }],
  categories: [...],
  weekly_plans: [{ id: 1, user_id: '123', status: 'active', ... }],
  planned_tasks: [...],
};
window.mockDataUtils.clear()
window.mockDataUtils.import(customData)
```

## Debugging

### Check Current Data
```javascript
// Export all data
const data = window.mockDataUtils.export()
console.table(data.planned_tasks)
console.table(data.categories)
```

### Inspect localStorage
```javascript
// List all mock keys
Object.keys(localStorage)
  .filter(k => k.startsWith('mock_supabase_'))
  .forEach(k => console.log(k, localStorage.getItem(k)))
```

### Reset Everything
```javascript
window.mockDataUtils.clear()
location.reload()
```

## FAQ

**Q: Can I use mock and real backend at the same time?**
A: No, it's either/or. Change `useMockBackend` in environment config.

**Q: Will my mock data persist after browser refresh?**
A: Yes, it's stored in localStorage. Clear browser data or use `window.mockDataUtils.clear()` to reset.

**Q: Can I use this for testing?**
A: Yes! Import specific test data for unit/integration tests.

**Q: Is the mock backend production-ready?**
A: **NO**. Mock backend is for development only. Production always uses real Supabase.

**Q: What happens if I deploy with `useMockBackend: true`?**
A: Users would have isolated data in their browser only (bad UX). Always set to `false` in production.

**Q: How do I test migrations?**
A: Migrations don't affect mock backend (it's just localStorage). Test migrations on real Supabase dev instance.

## Best Practices

✅ **DO:**
- Use mock backend for rapid prototyping
- Seed demo data for consistent testing
- Clear data between test scenarios
- Switch to real backend before committing

❌ **DON'T:**
- Deploy with `useMockBackend: true`
- Store sensitive data in mock backend
- Rely on mock backend for security testing
- Expect perfect Supabase parity (it's a simulation)

## Troubleshooting

**Issue: "Mock data utilities not available"**
- Check that `useMockBackend: true` in environment
- Refresh the page
- Check browser console for errors

**Issue: "Data not persisting"**
- Check localStorage isn't disabled
- Check browser isn't in private/incognito mode
- Try: `localStorage.setItem('test', '1')` to verify localStorage works

**Issue: "Auth state not updating"**
- Refresh the page
- Check `current_user` in localStorage
- Clear and re-seed data

**Issue: "Query returns empty array"**
- Check if data exists: `window.mockDataUtils.export()`
- Check filters match your data
- Verify `user_id` matches current user

## Need Real Backend?

If you need real Supabase for testing:

1. Set `useMockBackend: false` in `environment.ts`
2. Restart dev server: `npm start`
3. All operations now hit production Supabase

Or create a separate dev Supabase project (see main README).
