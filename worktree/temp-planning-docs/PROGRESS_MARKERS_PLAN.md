# Progress Markers Feature - Implementation Plan

**Date**: December 22, 2025
**Status**: In Progress
**Phase**: Phase 2A

## Overview

Implement a **metrics journal** feature allowing users to track measurements over time with complete freedom:
- No targets, no obligations, no schedules
- Log whenever they want (recommended weekly on Sunday, but not required)
- See long-term trends (6 months, 1 year)
- Link metrics to task categories for context

## Core Principles

1. **Completely Optional** - No impact on tier system, doesn't block any flows
2. **Zero Friction** - Simple data entry, no validation beyond basic types
3. **Passive Tracking** - User chooses when/what to measure
4. **Long-term Visibility** - Focus on trends over months, not daily changes
5. **No Recommendations** - Blank canvas, user defines what matters

## Database Schema

### Tables to Create

1. **progress_markers** - Metric definitions
   - `id` (BIGSERIAL PRIMARY KEY)
   - `user_id` (UUID, FK to profiles)
   - `category_id` (BIGINT, FK to categories, nullable)
   - `name` (TEXT, user-defined metric name)
   - `unit` (TEXT, e.g., "kg", "words", "hours")
   - `marker_type` (TEXT: 'manual' or 'auto_calculated')
   - `is_active` (BOOLEAN)
   - `created_at` (TIMESTAMPTZ)
   - UNIQUE constraint on (user_id, name)

2. **marker_entries** - Measurement logs
   - `id` (BIGSERIAL PRIMARY KEY)
   - `marker_id` (BIGINT, FK to progress_markers)
   - `value` (DECIMAL)
   - `notes` (TEXT, optional)
   - `entry_date` (DATE, can be backdated)
   - `logged_at` (TIMESTAMPTZ, system timestamp)
   - UNIQUE constraint on (marker_id, entry_date)

3. **marker_task_links** - Link markers to tasks for context
   - `marker_id` (BIGINT, FK to progress_markers)
   - `task_template_id` (BIGINT, FK to task_templates)
   - `created_at` (TIMESTAMPTZ)
   - PRIMARY KEY (marker_id, task_template_id)

### RLS Policies

- Users can only access their own markers and entries
- Marker entries accessible only if user owns the marker
- Task links require ownership of both marker and task template

### Helper Functions

1. `get_latest_marker_entry(marker_id)` - Get most recent entry
2. `calculate_marker_trend(marker_id, months)` - Calculate change over time
3. `calculate_linked_task_hours(marker_id)` - Sum hours from linked tasks

## TypeScript Interfaces

```typescript
// src/app/core/models/marker.model.ts

export interface ProgressMarker {
  id: number;
  user_id: string;
  category_id: number | null;
  name: string;
  unit: string | null;
  marker_type: 'manual' | 'auto_calculated';
  is_active: boolean;
  created_at: string;
}

export interface MarkerEntry {
  id: number;
  marker_id: number;
  value: number;
  notes: string | null;
  entry_date: string;  // ISO date string
  logged_at: string;   // ISO timestamp
}

export interface MarkerTaskLink {
  marker_id: number;
  task_template_id: number;
  created_at: string;
}

export interface MarkerWithLatestEntry extends ProgressMarker {
  latest_entry?: MarkerEntry;
  category?: { id: number; name: string };
}

export interface MarkerTrend {
  total_change: number;
  first_value: number;
  latest_value: number;
  first_date: string;
  latest_date: string;
  entry_count: number;
}
```

## Angular Service

### ProgressMarkerService

**Location**: `src/app/core/services/progress-marker.ts`

**Methods**:
- `loadUserMarkers()` - Fetch all active markers for current user
- `createMarker(data)` - Create new marker
- `updateMarker(id, data)` - Update marker name/unit/category
- `deactivateMarker(id)` - Soft delete (set is_active = false)
- `addEntry(markerId, value, entryDate?, notes?)` - Log measurement
- `updateEntry(entryId, value, notes)` - Edit entry
- `deleteEntry(entryId)` - Remove entry
- `getMarkerTrend(markerId, months)` - Get trend data
- `getMarkerEntries(markerId, limit?, offset?)` - Get paginated entries
- `linkTaskToMarker(markerId, taskTemplateId)` - Create task link
- `unlinkTaskFromMarker(markerId, taskTemplateId)` - Remove task link

**State Management**:
- Use Angular signals for reactive state
- `markers` signal containing user's markers
- `selectedMarker` signal for detail view
- Loading/error states

## UI Components

### 1. Marker List Component
**Path**: `src/app/features/profile/components/marker-list/`

**Features**:
- Empty state with illustration and link to blog
- List of user's markers grouped by category
- Show latest entry value and date
- Show trend indicator (↑/↓/→)
- "Add Marker" button
- Tap marker to view details

### 2. Create Marker Form
**Path**: `src/app/features/profile/components/marker-form/`

**Fields**:
- Name (required, text input, max 100 chars)
- Unit (optional, text input, max 20 chars)
- Category (optional, dropdown of user's categories)

**Validation**:
- Name required and unique per user
- No suggested values, no templates

### 3. Add Entry Form
**Path**: `src/app/features/profile/components/marker-entry-form/`

**Fields**:
- Value (required, number input, decimal support)
- Date (optional, defaults to today, can backdate)
- Notes (optional, textarea, max 500 chars)

**Features**:
- Quick entry mode for Sunday review
- Batch entry support (multiple markers at once)

### 4. Marker Detail View
**Path**: `src/app/features/profile/components/marker-detail/`

**Features**:
- Line chart showing trend (1/3/6/12 month views)
- List of all entries (paginated)
- Related effort display (if tasks linked)
- Edit/delete marker
- Add entry button

### 5. Profile Integration
**Path**: `src/app/features/profile/profile.ts`

**Changes**:
- Add "Progress Markers" tab
- Tab shows marker list or empty state
- No impact on existing tier/stats views

## Sunday Review Integration (Optional)

Add optional section in Sunday review:
- "Quick Check-in" card
- List active markers with last value
- Input field for new value
- "Skip All" and "Save Updates" buttons
- Completely optional, can be collapsed

## Implementation Steps

### Step 1: Database Migration ✅ (Pending MCP execution)
- Create migration SQL file
- Use Supabase MCP to apply migration
- Verify tables, indexes, RLS policies created

### Step 2: TypeScript Models
- Create `marker.model.ts` with interfaces
- Add to `index.ts` exports

### Step 3: Progress Marker Service
- Generate service using Angular CLI
- Implement CRUD methods
- Add signal-based state management
- Write unit tests

### Step 4: UI Components (Bottom-up approach)
- Generate components using Angular CLI
- Create marker form (create/edit)
- Create entry form
- Create marker list with empty state
- Create detail view with trend chart
- Integrate into profile component

### Step 5: Testing
- Unit tests for service methods
- Component tests for all UI
- Integration test: create marker → add entry → view trend
- Accessibility audit

### Step 6: Documentation
- Update CLAUDE.md with marker feature notes
- Create user guide blog post (external)
- Add inline help tooltips

## Non-Goals (Not in Phase 2A)

- ❌ Marker templates or suggestions
- ❌ Auto-calculated markers (deferred to Phase 2B)
- ❌ Charts/visualizations (basic list view only in 2A)
- ❌ Data export (CSV/JSON)
- ❌ Marker sharing/social features
- ❌ Reminders/notifications to log entries
- ❌ Goal setting based on markers

## Success Criteria

- [ ] User can create custom marker with name + unit
- [ ] User can log entry with value + date + optional note
- [ ] User can view list of markers with latest entry
- [ ] User can view all entries for a marker
- [ ] User can edit/delete markers and entries
- [ ] Empty state shows when no markers exist
- [ ] RLS policies prevent cross-user data access
- [ ] All tests pass
- [ ] Accessibility audit passes (WCAG AA)

## Next Steps

1. Apply database migration via Supabase MCP
2. Create TypeScript interfaces
3. Implement service layer
4. Build UI components
5. Write tests
6. User testing with 2-3 beta users

---

**Notes**:
- This is a completely standalone feature - can be rolled back without affecting core app
- Emphasize freedom and flexibility in all UX copy
- No "you should track X" messaging anywhere
- Link to external blog for inspiration (don't include in app)
