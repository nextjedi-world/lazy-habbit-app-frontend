/**
 * Application-wide constants
 * Centralizes all magic numbers and configuration values
 */

export const APP_CONSTANTS = {
  // Task duration limits (in minutes)
  MAX_TASK_DURATION_MINUTES: 480, // 8 hours
  MIN_TASK_DURATION_MINUTES: 5,

  // Frequency limits (times per week)
  MAX_WEEKLY_FREQUENCY: 7,
  MIN_WEEKLY_FREQUENCY: 1,

  // Tier system
  MIN_TIER: 0,
  MAX_TIER: 10,
  WEEKS_FOR_TIER_CHANGE: 3, // Consecutive weeks on same track
  BREAK_WEEKS_PER_YEAR: 4,

  // Scoring thresholds
  PROMOTION_THRESHOLD: 0.80, // 80% for promotion track
  STABLE_THRESHOLD: 0.60, // 60-79% for stable track
  CATEGORY_THRESHOLD: 0.50, // 50% minimum per category for clean week

  // UI timing (in milliseconds)
  UNDO_TOAST_DURATION_MS: 3000,
  SNACKBAR_DEFAULT_DURATION_MS: 3000,
  SNACKBAR_ERROR_DURATION_MS: 5000,

  // Planning window
  PLANNING_WINDOW_END_DAY: 2, // Tuesday (1=Monday, 2=Tuesday)

  // Week structure
  WEEK_START_DAY: 1, // Monday (1-7, where 1=Monday, 7=Sunday)
  DAYS_IN_WEEK: 7,

  // Target weekly hours range
  MIN_WEEKLY_HOURS: 0,
  TARGET_WEEKLY_HOURS_MIN: 25,
  TARGET_WEEKLY_HOURS_MAX: 35,
  MAX_WEEKLY_HOURS: 56, // 8 hours * 7 days

  // Network/Auth timeouts
  AUTH_INIT_TIMEOUT_MS: 5000,
  DEFAULT_REQUEST_TIMEOUT_MS: 30000,

  // Form validation
  MIN_TASK_NAME_LENGTH: 2,
  MAX_TASK_NAME_LENGTH: 100,

  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  TIER_HISTORY_DISPLAY_COUNT: 10,

  // Storage keys
  STORAGE_KEY_PREFIX: 'lazy_habbit_',
  DRAFT_PLAN_STORAGE_KEY: 'lazy_habbit_weekly_plan_draft',
  THEME_STORAGE_KEY: 'lazy_habbit_theme_preference',

  // Default category count
  DEFAULT_CATEGORIES_COUNT: 6,

  // Icons/Assets
  DEFAULT_AVATAR_SIZE: 48,
  TIER_BADGE_SIZE: 72,

  // Animation/Transition durations (in milliseconds)
  TRANSITION_FAST: 150,
  TRANSITION_NORMAL: 300,
  TRANSITION_SLOW: 500,

  // Z-index layers
  Z_INDEX: {
    BOTTOM_NAV: 100,
    STICKY_HEADER: 100,
    MODAL: 1000,
    TOAST: 1100,
    TOOLTIP: 1200,
  },
} as const;

// Type helper to ensure all values are readonly
export type AppConstants = typeof APP_CONSTANTS;
