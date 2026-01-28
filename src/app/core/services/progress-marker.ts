import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase';
import {
  ProgressMarker,
  MarkerEntry,
  MarkerWithLatestEntry,
  MarkerTrend,
  CreateMarkerDto,
  UpdateMarkerDto,
  CreateEntryDto,
  UpdateEntryDto,
  MarkerEntryListResponse,
} from '../models/marker.model';

@Injectable({
  providedIn: 'root',
})
export class ProgressMarkerService {
  private readonly supabase = inject(SupabaseService);

  // State management with signals
  private _markers = signal<MarkerWithLatestEntry[]>([]);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);

  // Read-only signals
  readonly markers = this._markers.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed signals
  readonly hasMarkers = computed(() => this._markers().length > 0);
  readonly activeMarkers = computed(() =>
    this._markers().filter((m) => m.is_active)
  );

  /**
   * Load all markers for the current user with their latest entries
   */
  async loadUserMarkers(): Promise<void> {
    try {
      this._isLoading.set(true);
      this._error.set(null);

      const { data, error } = await this.supabase.client
        .from('progress_markers')
        .select(`
          *,
          category:categories(id, name, color, icon),
          latest_entry:marker_entries(
            id,
            value,
            notes,
            entry_date,
            logged_at
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to include latest entry as single object
      const markers: MarkerWithLatestEntry[] = (data || []).map((marker: any) => ({
        ...marker,
        latest_entry: marker.latest_entry?.[0] || null,
      }));

      this._markers.set(markers);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load markers';
      this._error.set(message);
      console.error('Error loading markers:', err);
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Create a new progress marker
   */
  async createMarker(dto: CreateMarkerDto): Promise<ProgressMarker> {
    try {
      this._error.set(null);

      const user = await this.supabase.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await this.supabase.client
        .from('progress_markers')
        .insert({
          user_id: user.id,
          name: dto.name.trim(),
          unit: dto.unit?.trim() || null,
          category_id: dto.category_id || null,
          marker_type: dto.marker_type || 'manual',
        })
        .select()
        .single();

      if (error) throw error;

      // Reload markers to update UI
      await this.loadUserMarkers();

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create marker';
      this._error.set(message);
      console.error('Error creating marker:', err);
      throw err;
    }
  }

  /**
   * Update an existing marker
   */
  async updateMarker(id: number, dto: UpdateMarkerDto): Promise<ProgressMarker> {
    try {
      this._error.set(null);

      const updateData: any = {};
      if (dto.name !== undefined) updateData.name = dto.name.trim();
      if (dto.unit !== undefined) updateData.unit = dto.unit?.trim() || null;
      if (dto.category_id !== undefined) updateData.category_id = dto.category_id;
      if (dto.is_active !== undefined) updateData.is_active = dto.is_active;

      const { data, error } = await this.supabase.client
        .from('progress_markers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Reload markers to update UI
      await this.loadUserMarkers();

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update marker';
      this._error.set(message);
      console.error('Error updating marker:', err);
      throw err;
    }
  }

  /**
   * Soft delete a marker (set is_active = false)
   */
  async deactivateMarker(id: number): Promise<void> {
    await this.updateMarker(id, { is_active: false });
  }

  /**
   * Hard delete a marker and all its entries
   */
  async deleteMarker(id: number): Promise<void> {
    try {
      this._error.set(null);

      const { error } = await this.supabase.client
        .from('progress_markers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Reload markers to update UI
      await this.loadUserMarkers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete marker';
      this._error.set(message);
      console.error('Error deleting marker:', err);
      throw err;
    }
  }

  /**
   * Add a new measurement entry
   */
  async addEntry(dto: CreateEntryDto): Promise<MarkerEntry> {
    try {
      this._error.set(null);

      const entryDate = dto.entry_date || new Date().toISOString().split('T')[0];

      const { data, error } = await this.supabase.client
        .from('marker_entries')
        .insert({
          marker_id: dto.marker_id,
          value: dto.value,
          entry_date: entryDate,
          notes: dto.notes?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Reload markers to update latest_entry
      await this.loadUserMarkers();

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add entry';
      this._error.set(message);
      console.error('Error adding entry:', err);
      throw err;
    }
  }

  /**
   * Update an existing entry
   */
  async updateEntry(entryId: number, dto: UpdateEntryDto): Promise<MarkerEntry> {
    try {
      this._error.set(null);

      const updateData: any = {};
      if (dto.value !== undefined) updateData.value = dto.value;
      if (dto.notes !== undefined) updateData.notes = dto.notes?.trim() || null;

      const { data, error } = await this.supabase.client
        .from('marker_entries')
        .update(updateData)
        .eq('id', entryId)
        .select()
        .single();

      if (error) throw error;

      // Reload markers to update latest_entry if needed
      await this.loadUserMarkers();

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update entry';
      this._error.set(message);
      console.error('Error updating entry:', err);
      throw err;
    }
  }

  /**
   * Delete an entry
   */
  async deleteEntry(entryId: number): Promise<void> {
    try {
      this._error.set(null);

      const { error } = await this.supabase.client
        .from('marker_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      // Reload markers to update latest_entry
      await this.loadUserMarkers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete entry';
      this._error.set(message);
      console.error('Error deleting entry:', err);
      throw err;
    }
  }

  /**
   * Get all entries for a marker with pagination
   */
  async getMarkerEntries(
    markerId: number,
    limit = 50,
    offset = 0
  ): Promise<MarkerEntryListResponse> {
    try {
      this._error.set(null);

      // Get total count
      const { count } = await this.supabase.client
        .from('marker_entries')
        .select('*', { count: 'exact', head: true })
        .eq('marker_id', markerId);

      const totalCount = count || 0;

      // Get paginated entries
      const { data, error } = await this.supabase.client
        .from('marker_entries')
        .select('*')
        .eq('marker_id', markerId)
        .order('entry_date', { ascending: false })
        .order('logged_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        entries: data || [],
        total_count: totalCount,
        has_more: offset + limit < totalCount,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch entries';
      this._error.set(message);
      console.error('Error fetching entries:', err);
      throw err;
    }
  }

  /**
   * Get trend data for a marker using database function
   */
  async getMarkerTrend(markerId: number, months = 6): Promise<MarkerTrend | null> {
    try {
      this._error.set(null);

      const { data, error } = await this.supabase.client.rpc(
        'calculate_marker_trend',
        {
          p_marker_id: markerId,
          p_months: months,
        }
      );

      if (error) throw error;

      // If no entries in the time range, data will be empty
      if (!data || data.length === 0) return null;

      return data[0] as MarkerTrend;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to calculate trend';
      this._error.set(message);
      console.error('Error calculating trend:', err);
      throw err;
    }
  }

  /**
   * Link a task template to a marker
   */
  async linkTaskToMarker(markerId: number, taskTemplateId: number): Promise<void> {
    try {
      this._error.set(null);

      const { error } = await this.supabase.client
        .from('marker_task_links')
        .insert({
          marker_id: markerId,
          task_template_id: taskTemplateId,
        });

      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to link task';
      this._error.set(message);
      console.error('Error linking task to marker:', err);
      throw err;
    }
  }

  /**
   * Unlink a task template from a marker
   */
  async unlinkTaskFromMarker(markerId: number, taskTemplateId: number): Promise<void> {
    try {
      this._error.set(null);

      const { error } = await this.supabase.client
        .from('marker_task_links')
        .delete()
        .eq('marker_id', markerId)
        .eq('task_template_id', taskTemplateId);

      if (error) throw error;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unlink task';
      this._error.set(message);
      console.error('Error unlinking task from marker:', err);
      throw err;
    }
  }

  /**
   * Get total hours for linked tasks (auto-calculated markers)
   */
  async getLinkedTaskHours(markerId: number): Promise<number> {
    try {
      this._error.set(null);

      const { data, error } = await this.supabase.client.rpc(
        'calculate_linked_task_hours',
        {
          p_marker_id: markerId,
        }
      );

      if (error) throw error;

      return data || 0;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to calculate task hours';
      this._error.set(message);
      console.error('Error calculating task hours:', err);
      throw err;
    }
  }

  /**
   * Get a single marker by ID with latest entry
   */
  async getMarkerById(id: number): Promise<MarkerWithLatestEntry | null> {
    try {
      this._error.set(null);

      const { data, error } = await this.supabase.client
        .from('progress_markers')
        .select(`
          *,
          category:categories(id, name, color, icon),
          latest_entry:marker_entries(
            id,
            value,
            notes,
            entry_date,
            logged_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        latest_entry: data.latest_entry?.[0] || null,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch marker';
      this._error.set(message);
      console.error('Error fetching marker:', err);
      throw err;
    }
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this._error.set(null);
  }
}
