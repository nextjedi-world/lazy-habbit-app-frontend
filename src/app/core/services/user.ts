import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase';
import { Logger } from './logger';
import { UserProfile, Category, TierHistory } from '../models/user.model';

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
    const defaultCategories = [
      { name: 'Health', display_order: 1 },
      { name: 'Learning', display_order: 2 },
      { name: 'Creative', display_order: 3 },
      { name: 'Leisure', display_order: 4 },
      { name: 'Project', display_order: 5 },
      { name: 'Career', display_order: 6 },
    ];

    try {
      const { data, error } = await this.supabase.client
        .from('categories')
        .insert(
          defaultCategories.map(cat => ({
            user_id: userId,
            name: cat.name,
            display_order: cat.display_order,
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
