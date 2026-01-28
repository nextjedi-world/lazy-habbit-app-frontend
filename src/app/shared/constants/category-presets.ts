/**
 * Category Presets Configuration
 * Centralized color and icon combinations for user categories
 *
 * This file defines the available preset options users can choose from when
 * creating or customizing categories. Each preset includes a unique color
 * and Material icon that follows accessibility guidelines (WCAG AA contrast).
 */

export interface CategoryPreset {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
}

/**
 * Available category presets (15 options)
 * Users can select from these when creating/editing categories
 */
export const CATEGORY_PRESETS: CategoryPreset[] = [
  // Default 6 categories
  {
    id: 'health-red',
    name: 'Health',
    color: '#ef4444',
    icon: 'fitness_center',
    description: 'Fitness & wellness activities'
  },
  {
    id: 'learning-blue',
    name: 'Learning',
    color: '#3b82f6',
    icon: 'school',
    description: 'Education & skill development'
  },
  {
    id: 'creative-purple',
    name: 'Creative',
    color: '#8b5cf6',
    icon: 'palette',
    description: 'Art, writing, and creative pursuits'
  },
  {
    id: 'leisure-green',
    name: 'Leisure',
    color: '#10b981',
    icon: 'sports_esports',
    description: 'Hobbies and intentional rest'
  },
  {
    id: 'project-orange',
    name: 'Project',
    color: '#f59e0b',
    icon: 'construction',
    description: 'Side projects and building'
  },
  {
    id: 'career-cyan',
    name: 'Career',
    color: '#06b6d4',
    icon: 'work',
    description: 'Professional growth and networking'
  },

  // Additional presets (9 more options)
  {
    id: 'social-pink',
    name: 'Social',
    color: '#ec4899',
    icon: 'people',
    description: 'Relationships and social connections'
  },
  {
    id: 'finance-emerald',
    name: 'Finance',
    color: '#059669',
    icon: 'attach_money',
    description: 'Money management and investing'
  },
  {
    id: 'wellness-teal',
    name: 'Wellness',
    color: '#14b8a6',
    icon: 'spa',
    description: 'Mental health and self-care'
  },
  {
    id: 'spiritual-indigo',
    name: 'Spiritual',
    color: '#6366f1',
    icon: 'self_improvement',
    description: 'Inner growth and mindfulness'
  },
  {
    id: 'reading-amber',
    name: 'Reading',
    color: '#f59e0b',
    icon: 'menu_book',
    description: 'Books, articles, and research'
  },
  {
    id: 'cooking-rose',
    name: 'Cooking',
    color: '#fb7185',
    icon: 'restaurant',
    description: 'Culinary skills and meal prep'
  },
  {
    id: 'music-violet',
    name: 'Music',
    color: '#a78bfa',
    icon: 'music_note',
    description: 'Musical practice and appreciation'
  },
  {
    id: 'language-sky',
    name: 'Language',
    color: '#0ea5e9',
    icon: 'translate',
    description: 'Language learning and practice'
  },
  {
    id: 'volunteering-lime',
    name: 'Volunteering',
    color: '#84cc16',
    icon: 'volunteer_activism',
    description: 'Community service and giving back'
  },

  // Special preset for uncategorized tasks
  {
    id: 'uncategorized-gray',
    name: 'Uncategorized',
    color: '#6b7280',
    icon: 'category',
    description: 'Tasks without a specific category'
  },
];

/**
 * Default category preset IDs
 * These 6 categories are created for new users automatically
 */
export const DEFAULT_CATEGORY_IDS = [
  'health-red',
  'learning-blue',
  'creative-purple',
  'leisure-green',
  'project-orange',
  'career-cyan',
];

/**
 * Get preset by ID
 * @param presetId - The preset ID to look up
 * @returns The matching CategoryPreset or undefined if not found
 */
export function getPresetById(presetId: string): CategoryPreset | undefined {
  return CATEGORY_PRESETS.find(p => p.id === presetId);
}

/**
 * Get color for category name (backward compatibility)
 * @param categoryName - The category name
 * @returns Hex color code or gray fallback
 */
export function getCategoryColor(categoryName: string): string {
  const preset = CATEGORY_PRESETS.find(
    p => p.name.toLowerCase() === categoryName.toLowerCase()
  );
  return preset?.color || '#6b7280'; // Gray fallback
}

/**
 * Get icon for category name (backward compatibility)
 * @param categoryName - The category name
 * @returns Material icon name or generic fallback
 */
export function getCategoryIcon(categoryName: string): string {
  const preset = CATEGORY_PRESETS.find(
    p => p.name.toLowerCase() === categoryName.toLowerCase()
  );
  return preset?.icon || 'category'; // Generic fallback
}
