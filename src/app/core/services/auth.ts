import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase';
import { User } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  private _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();

  private _isAuthenticated = signal(false);
  readonly isAuthenticated = this._isAuthenticated.asReadonly();

  private _isInitialized = signal(false);
  readonly isInitialized = this._isInitialized.asReadonly();

  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    try {
      // Check initial auth state (Supabase automatically restores from localStorage)
      const user = await this.supabase.getCurrentUser();
      this._currentUser.set(user);
      this._isAuthenticated.set(!!user);
      this._isInitialized.set(true);

      // Listen to auth changes
      this.supabase.onAuthStateChange((user) => {
        this._currentUser.set(user);
        this._isAuthenticated.set(!!user);
      });
    } catch (error) {
      console.error('Auth initialization failed:', error);
      this._isInitialized.set(true);
    }
  }

  /**
   * Wait for auth initialization to complete
   * This should be called by guards before checking auth state
   */
  async waitForInit(): Promise<void> {
    return this.initPromise;
  }

  async signUp(email: string, password: string, name: string) {
    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    this._currentUser.set(data.user);
    this._isAuthenticated.set(true);

    return data;
  }

  async signOut() {
    const { error } = await this.supabase.client.auth.signOut();
    if (error) throw error;

    this._currentUser.set(null);
    this._isAuthenticated.set(false);

    this.router.navigate(['/auth/login']);
  }
}
