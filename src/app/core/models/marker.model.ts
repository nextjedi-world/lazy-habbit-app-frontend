/**
 * Progress Markers - Data Models
 *
 * These interfaces represent the progress tracking feature that allows users
 * to log measurements over time with complete freedom (no targets, no obligations).
 */

/**
 * Progress Marker - A user-defined metric to track over time
 * Examples: "Body Weight", "Novel Word Count", "Meditation Days"
 */
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

/**
 * Marker Entry - A single measurement log entry
 */
export interface MarkerEntry {
  id: number;
  marker_id: number;
  value: number;
  notes: string | null;
  entry_date: string;  // ISO date string (YYYY-MM-DD)
  logged_at: string;   // ISO timestamp
}

/**
 * Marker Task Link - Links a marker to task templates for context
 * Example: "Total Novel Hours" marker linked to "Writing" task template
 */
export interface MarkerTaskLink {
  marker_id: number;
  task_template_id: number;
  created_at: string;
}

/**
 * Progress Marker with Latest Entry - Extended marker with most recent value
 * Used for displaying markers in list view
 */
export interface MarkerWithLatestEntry extends ProgressMarker {
  latest_entry?: MarkerEntry | null;
  category?: {
    id: number;
    name: string;
    color?: string;
    icon?: string;
  } | null;
}

/**
 * Marker Trend - Calculated change over a time period
 * Returned by calculate_marker_trend() database function
 */
export interface MarkerTrend {
  total_change: number;
  first_value: number;
  latest_value: number;
  first_date: string;  // ISO date string
  latest_date: string; // ISO date string
  entry_count: number;
}

/**
 * Create Marker DTO - Data for creating a new marker
 */
export interface CreateMarkerDto {
  name: string;
  unit?: string;
  category_id?: number;
  marker_type?: 'manual' | 'auto_calculated';
}

/**
 * Update Marker DTO - Data for updating an existing marker
 */
export interface UpdateMarkerDto {
  name?: string;
  unit?: string;
  category_id?: number;
  is_active?: boolean;
}

/**
 * Create Entry DTO - Data for logging a new measurement
 */
export interface CreateEntryDto {
  marker_id: number;
  value: number;
  entry_date?: string;  // ISO date, defaults to today
  notes?: string;
}

/**
 * Update Entry DTO - Data for editing an existing entry
 */
export interface UpdateEntryDto {
  value?: number;
  notes?: string;
}

/**
 * Marker Entry List Response - Paginated entries for a marker
 */
export interface MarkerEntryListResponse {
  entries: MarkerEntry[];
  total_count: number;
  has_more: boolean;
}

/**
 * Trend Period - Time range options for trend visualization
 */
export type TrendPeriod = 1 | 3 | 6 | 12;  // months

/**
 * Trend Direction - Visual indicator for trend
 */
export type TrendDirection = 'up' | 'down' | 'stable';

/**
 * Get trend direction based on change value
 */
export function getTrendDirection(change: number, threshold = 0.01): TrendDirection {
  if (Math.abs(change) < threshold) return 'stable';
  return change > 0 ? 'up' : 'down';
}

/**
 * Get trend icon for display
 */
export function getTrendIcon(direction: TrendDirection): string {
  switch (direction) {
    case 'up': return '↑';
    case 'down': return '↓';
    case 'stable': return '→';
  }
}

/**
 * Format marker value with unit
 */
export function formatMarkerValue(value: number, unit: string | null): string {
  const formattedValue = Number.isInteger(value) ? value.toString() : value.toFixed(2);
  return unit ? `${formattedValue} ${unit}` : formattedValue;
}

/**
 * Calculate days since last entry
 */
export function getDaysSinceEntry(entryDate: string): number {
  const entry = new Date(entryDate);
  const today = new Date();
  const diffTime = today.getTime() - entry.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format relative time for last entry display
 * Examples: "today", "yesterday", "3 days ago", "2 weeks ago"
 */
export function formatRelativeTime(entryDate: string): string {
  const days = getDaysSinceEntry(entryDate);

  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return '1 month ago';

  const months = Math.floor(days / 30);
  return `${months} months ago`;
}
