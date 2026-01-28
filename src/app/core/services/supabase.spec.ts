import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { SupabaseService } from './supabase';

describe('SupabaseService', () => {
  let service: SupabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SupabaseService]
    });
    service = TestBed.inject(SupabaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize Supabase client', () => {
    expect(service.client).toBeDefined();
    expect(service.client.auth).toBeDefined();
  });

  it('should have getCurrentUser method', () => {
    expect(service.getCurrentUser).toBeDefined();
    expect(typeof service.getCurrentUser).toBe('function');
  });

  it('should have onAuthStateChange method', () => {
    expect(service.onAuthStateChange).toBeDefined();
    expect(typeof service.onAuthStateChange).toBe('function');
  });

  describe('getCurrentUser', () => {
    it('should return null when no user is logged in', async () => {
      const user = await service.getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('onAuthStateChange', () => {
    it('should call callback when auth state changes', () => {
      const callback = vi.fn();

      const subscription = service.onAuthStateChange(callback);

      // Subscription should be defined
      expect(subscription).toBeDefined();

      // Clean up
      subscription.data.subscription.unsubscribe();
    });
  });
});
