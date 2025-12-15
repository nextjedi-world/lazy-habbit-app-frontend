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

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    // Check initial auth state
    const user = await this.supabase.getCurrentUser();
    this._currentUser.set(user);
    this._isAuthenticated.set(!!user);

    // Listen to auth changes
    this.supabase.onAuthStateChange((user) => {
      this._currentUser.set(user);
      this._isAuthenticated.set(!!user);
    });
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
