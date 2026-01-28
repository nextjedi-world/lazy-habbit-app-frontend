-- ============================================================================
-- CATEGORY PRESETS MIGRATION
-- ============================================================================
-- This migration adds preset_id, color, and icon columns to the categories
-- table to support the category preset system with 15 predefined color/icon
-- combinations.
-- ============================================================================

-- Add new columns to categories table
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS preset_id TEXT,
  ADD COLUMN IF NOT EXISTS color TEXT,
  ADD COLUMN IF NOT EXISTS icon TEXT;

-- Add index for faster preset lookups
CREATE INDEX IF NOT EXISTS idx_categories_preset_id ON categories(preset_id);

-- Update existing categories with their corresponding preset IDs
-- This ensures backward compatibility with existing data
UPDATE categories
SET preset_id = CASE name
  WHEN 'Health' THEN 'health-red'
  WHEN 'Learning' THEN 'learning-blue'
  WHEN 'Creative' THEN 'creative-purple'
  WHEN 'Leisure' THEN 'leisure-green'
  WHEN 'Project' THEN 'project-orange'
  WHEN 'Career' THEN 'career-cyan'
  ELSE 'uncategorized-gray'
END
WHERE preset_id IS NULL;

-- Add comment explaining the preset system
COMMENT ON COLUMN categories.preset_id IS 'Reference to CategoryPreset ID from category-presets.ts (e.g., health-red, learning-blue)';
COMMENT ON COLUMN categories.color IS 'Optional custom hex color override (defaults to preset color if not set)';
COMMENT ON COLUMN categories.icon IS 'Optional custom Material icon name override (defaults to preset icon if not set)';
