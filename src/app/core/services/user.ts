import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase';
import { Logger } from './logger';
import { UserProfile, Category, CategoryWithPreset, TierHistory } from '../models/user.model';
import { DEFAULT_CATEGORY_IDS, getPresetById } from '../../shared/constants/category-presets';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private supabase = inject(SupabaseService);
  private logger = inject(Logger);

  // State signals
  private profileSignal = signal<UserProfile | null>(null);
  private categoriesSignal = signal<Category[]>([]);
  private tierHistorySignal = signal<TierHistory[]>([]);
  private loadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  // Computed signals
  profile = this.profileSignal.asReadonly();
  categories = this.categoriesSignal.asReadonly();
  tierHistory = this.tierHistorySignal.asReadonly();
  loading = this.loadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();
  currentTier = computed(() => this.profileSignal()?.current_tier ?? 0);

  /**
   * Ensure user profile exists
   * This is a safeguard for cases where the signup trigger didn't create the profile
   */
  private async ensureProfileExists(userId: string): Promise<UserProfile> {
    try {
      // Check if profile exists
      const { data: profile, error: profileError } = await this.supabase.client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Profile exists, return it
      if (profile && !profileError) {
        return profile;
      }

      // Profile doesn't exist - create it
      const user = await this.supabase.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: newProfile, error: createError } = await this.supabase.client
        .from('profiles')
        .insert({
          id: userId,
          email: user.email ?? '',
          name: user.user_metadata?.['name'] ?? 'User',
          current_tier: 0
        })
        .select()
        .single();

      if (createError || !newProfile) {
        this.logger.error('Failed to create profile:', createError);
        throw new Error('Failed to create user profile. Please contact support.');
      }

      this.logger.log('Profile created successfully for user:', userId);

      // Create default categories for new user
      await this.createDefaultCategories(userId);

      return newProfile;
    } catch (err) {
      this.logger.error('Error ensuring profile exists:', err);
      throw err;
    }
  }

  /**
   * Load user profile from database
   */
  async loadProfile(userId: string): Promise<void> {
    // Input validation
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID: must be a non-empty string');
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    try {
      const profile = await this.ensureProfileExists(userId);
      this.profileSignal.set(profile);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to load profile');
      throw err;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Load user categories
   */
  async loadCategories(userId: string): Promise<void> {
    // Input validation
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID: must be a non-empty string');
    }

    this.errorSignal.set(null);

    try {
      // Ensure profile exists first
      await this.ensureProfileExists(userId);

      const { data, error } = await this.supabase.client
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('display_order');

      if (error) throw error;

      // If no categories exist, create default ones
      if (!data || data.length === 0) {
        await this.createDefaultCategories(userId);
        return;
      }

      this.categoriesSignal.set(data);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to load categories');
      throw err;
    }
  }

  /**
   * Create default categories for new user
   */
  async createDefaultCategories(userId: string): Promise<void> {
    const defaultCategories = DEFAULT_CATEGORY_IDS.map((presetId, index) => {
      const preset = getPresetById(presetId);
      return {
        name: preset?.name || 'Category',
        display_order: index + 1,
        preset_id: presetId,
      };
    });

    try {
      const { data, error } = await this.supabase.client
        .from('categories')
        .insert(
          defaultCategories.map(cat => ({
            user_id: userId,
            name: cat.name,
            display_order: cat.display_order,
            preset_id: cat.preset_id,
          }))
        )
        .select();

      if (error) throw error;
      this.categoriesSignal.set(data ?? []);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to create categories');
      throw err;
    }
  }

  /**
   * Create a new category
   * @param userId - The user ID
   * @param name - Category name (2-50 characters)
   * @param presetId - Preset ID from category-presets.ts
   * @returns The created category
   */
  async createCategory(
    userId: string,
    name: string,
    presetId: string
  ): Promise<Category> {
    // Input validation
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID: must be a non-empty string');
    }
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Category name is required');
    }
    if (name.length < 2 || name.length > 50) {
      throw new Error('Category name must be between 2 and 50 characters');
    }
    if (!presetId || typeof presetId !== 'string') {
      throw new Error('Preset ID is required');
    }

    try {
      // Get current categories to determine display_order
      const currentCategories = this.categoriesSignal();
      const maxOrder =
        currentCategories.length > 0
          ? Math.max(...currentCategories.map(c => c.display_order))
          : 0;

      const { data, error } = await this.supabase.client
        .from('categories')
        .insert({
          user_id: userId,
          name: name.trim(),
          preset_id: presetId,
          display_order: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from insert');

      // Update local state
      this.categoriesSignal.update(cats => [...cats, data]);

      this.logger.log('Category created:', data.name);
      return data;
    } catch (err) {
      this.errorSignal.set(
        err instanceof Error ? err.message : 'Failed to create category'
      );
      throw err;
    }
  }

  /**
   * Update category (rename or change preset)
   * @param categoryId - The category ID
   * @param updates - Fields to update (name, preset_id)
   * @returns The updated category
   */
  async updateCategory(
    categoryId: number,
    updates: { name?: string; preset_id?: string }
  ): Promise<Category> {
    // Input validation
    if (typeof categoryId !== 'number' || categoryId <= 0) {
      throw new Error('Invalid category ID');
    }
    if (!updates || typeof updates !== 'object') {
      throw new Error('Updates object is required');
    }
    if (updates.name !== undefined) {
      if (
        typeof updates.name !== 'string' ||
        updates.name.trim().length === 0
      ) {
        throw new Error('Category name must be a non-empty string');
      }
      if (updates.name.length < 2 || updates.name.length > 50) {
        throw new Error('Category name must be between 2 and 50 characters');
      }
    }

    try {
      const { data, error } = await this.supabase.client
        .from('categories')
        .update(updates)
        .eq('id', categoryId)
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from update');

      // Update local state
      this.categoriesSignal.update(cats =>
        cats.map(c => (c.id === categoryId ? data : c))
      );

      this.logger.log('Category updated:', data.name);
      return data;
    } catch (err) {
      this.errorSignal.set(
        err instanceof Error ? err.message : 'Failed to update category'
      );
      throw err;
    }
  }

  /**
   * Delete category and reassign tasks to Uncategorized
   * @param userId - The user ID
   * @param categoryId - The category ID to delete
   */
  async deleteCategory(userId: string, categoryId: number): Promise<void> {
    // Input validation
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID');
    }
    if (typeof categoryId !== 'number' || categoryId <= 0) {
      throw new Error('Invalid category ID');
    }

    try {
      // Step 1: Ensure Uncategorized category exists
      const uncategorized = await this.ensureUncategorizedCategory(userId);

      // Step 2: Reassign all task_templates to Uncategorized
      const { error: templatesError } = await this.supabase.client
        .from('task_templates')
        .update({ category_id: uncategorized.id })
        .eq('category_id', categoryId);

      if (templatesError) throw templatesError;

      // Step 3: Reassign all planned_tasks to Uncategorized
      const { error: plannedError } = await this.supabase.client
        .from('planned_tasks')
        .update({ category_id: uncategorized.id })
        .eq('category_id', categoryId);

      if (plannedError) throw plannedError;

      // Step 4: Delete the category
      const { error: deleteError } = await this.supabase.client
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (deleteError) throw deleteError;

      // Step 5: Update local state
      this.categoriesSignal.update(cats =>
        cats.filter(c => c.id !== categoryId)
      );

      this.logger.log('Category deleted:', categoryId);
    } catch (err) {
      this.errorSignal.set(
        err instanceof Error ? err.message : 'Failed to delete category'
      );
      throw err;
    }
  }

  /**
   * Ensure Uncategorized category exists
   * Creates it if needed, returns existing if present
   * @private
   */
  private async ensureUncategorizedCategory(
    userId: string
  ): Promise<Category> {
    try {
      // Check if Uncategorized already exists
      const { data: existing, error: findError } = await this.supabase.client
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .eq('name', 'Uncategorized')
        .maybeSingle();

      if (findError) throw findError;
      if (existing) return existing;

      // Create Uncategorized category
      const { data: created, error: createError } = await this.supabase.client
        .from('categories')
        .insert({
          user_id: userId,
          name: 'Uncategorized',
          preset_id: 'uncategorized-gray',
          display_order: 9999, // Always at the end
        })
        .select()
        .single();

      if (createError) throw createError;
      if (!created)
        throw new Error('Failed to create Uncategorized category');

      // Update local state
      this.categoriesSignal.update(cats => [...cats, created]);

      return created;
    } catch (err) {
      this.logger.error('Failed to ensure Uncategorized category:', err);
      throw err;
    }
  }

  /**
   * Reorder categories (drag-and-drop support)
   * @param orderedCategoryIds - Array of category IDs in new order
   */
  async reorderCategories(orderedCategoryIds: number[]): Promise<void> {
    // Input validation
    if (!Array.isArray(orderedCategoryIds)) {
      throw new Error('orderedCategoryIds must be an array');
    }
    if (orderedCategoryIds.length === 0) {
      throw new Error('Cannot reorder empty category list');
    }

    try {
      // Update display_order for each category
      const updates = orderedCategoryIds.map((id, index) => ({
        id,
        display_order: index + 1,
      }));

      // Batch update
      const promises = updates.map(({ id, display_order }) =>
        this.supabase.client
          .from('categories')
          .update({ display_order })
          .eq('id', id)
      );

      const results = await Promise.all(promises);

      // Check for errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error(`Failed to reorder ${errors.length} categories`);
      }

      // Reload categories to refresh order
      const userId = this.profileSignal()?.id;
      if (userId) {
        await this.loadCategories(userId);
      }

      this.logger.log('Categories reordered successfully');
    } catch (err) {
      this.errorSignal.set(
        err instanceof Error ? err.message : 'Failed to reorder categories'
      );
      throw err;
    }
  }

  /**
   * Get category with computed color/icon from preset
   * @param category - The category to enhance with preset data
   * @returns Category with resolved color and icon
   */
  getCategoryWithPreset(category: Category): CategoryWithPreset {
    const preset = category.preset_id
      ? getPresetById(category.preset_id)
      : undefined;

    return {
      ...category,
      color: category.color || preset?.color || '#6b7280',
      icon: category.icon || preset?.icon || 'category',
    };
  }

  /**
   * Update user tier
   */
  async updateTier(userId: string, newTier: number, reason: string): Promise<void> {
    // Input validation
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID: must be a non-empty string');
    }
    if (typeof newTier !== 'number' || newTier < 0 || newTier > 10) {
      throw new Error('Invalid tier: must be a number between 0 and 10');
    }
    if (!reason || typeof reason !== 'string') {
      throw new Error('Invalid reason: must be a non-empty string');
    }

    try {
      const oldTier = this.profileSignal()?.current_tier ?? 0;

      // Update profile
      const { error: profileError } = await this.supabase.client
        .from('profiles')
        .update({ current_tier: newTier })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Record tier history
      const { error: historyError } = await this.supabase.client
        .from('tier_history')
        .insert({
          user_id: userId,
          old_tier: oldTier,
          new_tier: newTier,
          reason,
        });

      if (historyError) throw historyError;

      // Update local state
      const currentProfile = this.profileSignal();
      if (currentProfile) {
        this.profileSignal.set({ ...currentProfile, current_tier: newTier });
      }

      // Reload tier history
      await this.loadTierHistory(userId);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to update tier');
      throw err;
    }
  }

  /**
   * Load tier history
   */
  async loadTierHistory(userId: string): Promise<void> {
    // Input validation
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID: must be a non-empty string');
    }

    try {
      const { data, error } = await this.supabase.client
        .from('tier_history')
        .select('*')
        .eq('user_id', userId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      this.tierHistorySignal.set(data ?? []);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to load tier history');
      throw err;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    // Input validation
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID: must be a non-empty string');
    }
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      throw new Error('Invalid updates: must be a non-empty object');
    }

    try {
      const { data, error } = await this.supabase.client
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      this.profileSignal.set(data);
    } catch (err) {
      this.errorSignal.set(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  }

  /**
   * Clear state (for logout)
   */
  clearState(): void {
    this.profileSignal.set(null);
    this.categoriesSignal.set([]);
    this.tierHistorySignal.set([]);
    this.errorSignal.set(null);
  }
}
