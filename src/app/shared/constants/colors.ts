/**
 * Color Constants for Lazy Habbit App
 *
 * Vibrant, energetic color palette aligned with Material Design 3 theme
 * Used for TypeScript logic and dynamic styling
 */

// ========================================
// Primary Colors (Vibrant Blue)
// ========================================
export const PRIMARY = '#2563EB';
export const PRIMARY_LIGHT = '#4f7ef7';
export const PRIMARY_LIGHTER = '#7199ff';
export const PRIMARY_DARK = '#0041a8';

// ========================================
// Accent Colors (Energetic Orange)
// ========================================
export const ACCENT = '#F97316';
export const ACCENT_LIGHT = '#ff8c3f';
export const ACCENT_LIGHTER = '#ffa361';
export const ACCENT_DARK = '#ba3a00';

// ========================================
// Success Colors (Fresh Green)
// ========================================
export const SUCCESS = '#10B981';
export const SUCCESS_LIGHT = '#3dd598';
export const SUCCESS_LIGHTER = '#5ce0ad';
export const SUCCESS_DARK = '#006e41';

// ========================================
// Warning Colors (Bright Yellow)
// ========================================
export const WARNING = '#FBBF24';
export const WARNING_LIGHT = '#ffd54f';
export const WARNING_LIGHTER = '#ffe066';
export const WARNING_DARK = '#655d00';

// ========================================
// Danger Colors (Bold Red)
// ========================================
export const DANGER = '#EF4444';
export const DANGER_LIGHT = '#ff6961';
export const DANGER_LIGHTER = '#ff897d';
export const DANGER_DARK = '#c70025';

// ========================================
// Tier Colors (0-10 Progression)
// ========================================
export const TIER_COLORS = [
  '#94a3b8', // Tier 0: Slate (Starting point)
  '#60a5fa', // Tier 1: Blue (Early progress)
  '#34d399', // Tier 2: Green (Growth)
  '#fbbf24', // Tier 3: Yellow (Caution)
  '#fb923c', // Tier 4: Orange (Warning)
  '#f87171', // Tier 5: Red (Critical)
  '#c084fc', // Tier 6: Purple (Recovery)
  '#e879f9', // Tier 7: Fuchsia (Advanced)
  '#fbbf24', // Tier 8: Gold (Excellence)
  '#fb7185', // Tier 9: Rose (Near mastery)
  '#a78bfa', // Tier 10: Violet (Mastery)
] as const;

// ========================================
// Category Colors (Default 6 Categories)
// ========================================
export const CATEGORY_COLORS = {
  health: '#10B981',    // Green - Health
  learning: '#2563EB',  // Blue - Learning
  creative: '#F97316',  // Orange - Creative
  leisure: '#FBBF24',   // Yellow - Leisure
  project: '#c084fc',   // Purple - Project
  career: '#EF4444',    // Red - Career
} as const;

// ========================================
// Score Range Colors
// ========================================
export const SCORE_COLORS = {
  excellent: SUCCESS,      // 90-100% (Clean week, promotion track)
  good: SUCCESS_LIGHT,     // 80-89% (Promotion eligible)
  average: WARNING,        // 60-79% (Stable)
  poor: DANGER_LIGHT,      // 50-59% (At risk)
  critical: DANGER,        // Below 50% (Demotion track)
} as const;

// ========================================
// Tier Track Colors
// ========================================
export const TIER_TRACK_COLORS = {
  promotion: SUCCESS,      // Green - Promotion track
  stable: PRIMARY,         // Blue - Stable track
  demotion: DANGER,        // Red - Demotion track
} as const;

// ========================================
// Neutral Colors
// ========================================
export const SURFACE = '#ffffff';
export const SURFACE_VARIANT = '#f5f5f5';
export const SURFACE_TINT = '#f0f9ff';
export const ON_SURFACE = '#1a1a1a';
export const ON_SURFACE_VARIANT = '#666666';

// Dark mode variants
export const SURFACE_DARK = '#1a1a1a';
export const SURFACE_VARIANT_DARK = '#2a2a2a';
export const SURFACE_TINT_DARK = '#0f172a';
export const ON_SURFACE_DARK = '#f5f5f5';
export const ON_SURFACE_VARIANT_DARK = '#a3a3a3';

// ========================================
// Helper Functions
// ========================================

/**
 * Get color for tier level (0-10)
 * @param tier Tier level from 0 to 10
 * @returns Hex color string
 */
export function getTierColor(tier: number): string {
  const clampedTier = Math.max(0, Math.min(10, Math.floor(tier)));
  return TIER_COLORS[clampedTier];
}

/**
 * Get color for weekly score percentage
 * @param scorePercent Score percentage (0-100)
 * @returns Hex color string
 */
export function getScoreColor(scorePercent: number): string {
  if (scorePercent >= 90) return SCORE_COLORS.excellent;
  if (scorePercent >= 80) return SCORE_COLORS.good;
  if (scorePercent >= 60) return SCORE_COLORS.average;
  if (scorePercent >= 50) return SCORE_COLORS.poor;
  return SCORE_COLORS.critical;
}

/**
 * Get color for tier track status
 * @param track Tier track ('promotion' | 'stable' | 'demotion')
 * @returns Hex color string
 */
export function getTierTrackColor(track: 'promotion' | 'stable' | 'demotion'): string {
  return TIER_TRACK_COLORS[track];
}

/**
 * Get category color by name (case-insensitive)
 * @param categoryName Category name
 * @returns Hex color string or primary color as fallback
 */
export function getCategoryColor(categoryName: string): string {
  const key = categoryName.toLowerCase() as keyof typeof CATEGORY_COLORS;
  return CATEGORY_COLORS[key] || PRIMARY;
}

/**
 * Convert hex color to RGB with alpha
 * @param hex Hex color string (e.g., '#2563EB')
 * @param alpha Alpha value 0-1 (default: 1)
 * @returns RGBA string (e.g., 'rgba(37, 99, 235, 1)')
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Get contrasting text color (black or white) for background
 * @param bgColor Background color hex string
 * @returns '#ffffff' for dark backgrounds, '#1a1a1a' for light backgrounds
 */
export function getContrastTextColor(bgColor: string): string {
  const r = parseInt(bgColor.slice(1, 3), 16);
  const g = parseInt(bgColor.slice(3, 5), 16);
  const b = parseInt(bgColor.slice(5, 7), 16);

  // Calculate luminance (perceived brightness)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? ON_SURFACE : '#ffffff';
}

// ========================================
// Color Palette Export (for external use)
// ========================================

export const COLOR_PALETTE = {
  primary: {
    main: PRIMARY,
    light: PRIMARY_LIGHT,
    lighter: PRIMARY_LIGHTER,
    dark: PRIMARY_DARK,
  },
  accent: {
    main: ACCENT,
    light: ACCENT_LIGHT,
    lighter: ACCENT_LIGHTER,
    dark: ACCENT_DARK,
  },
  success: {
    main: SUCCESS,
    light: SUCCESS_LIGHT,
    lighter: SUCCESS_LIGHTER,
    dark: SUCCESS_DARK,
  },
  warning: {
    main: WARNING,
    light: WARNING_LIGHT,
    lighter: WARNING_LIGHTER,
    dark: WARNING_DARK,
  },
  danger: {
    main: DANGER,
    light: DANGER_LIGHT,
    lighter: DANGER_LIGHTER,
    dark: DANGER_DARK,
  },
  neutral: {
    surface: SURFACE,
    surfaceVariant: SURFACE_VARIANT,
    surfaceTint: SURFACE_TINT,
    onSurface: ON_SURFACE,
    onSurfaceVariant: ON_SURFACE_VARIANT,
  },
  dark: {
    surface: SURFACE_DARK,
    surfaceVariant: SURFACE_VARIANT_DARK,
    surfaceTint: SURFACE_TINT_DARK,
    onSurface: ON_SURFACE_DARK,
    onSurfaceVariant: ON_SURFACE_VARIANT_DARK,
  },
} as const;
