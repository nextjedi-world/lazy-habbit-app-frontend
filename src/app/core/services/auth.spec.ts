import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth';
import { SupabaseService } from './supabase';
import { User } from '@supabase/supabase-js';

describe('AuthService', () => {
  let service: AuthService;
  let supabaseMock: any;
  let routerMock: any;

  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: { name: 'Test User' },
    aud: 'authenticated',
    created_at: new Date().toISOString()
  };

  beforeEach(() => {
    // Create mocks
    const supabaseClientMock = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        signUp: vi.fn(),
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } }
        })
      }
    };

    supabaseMock = {
      client: supabaseClientMock,
      getCurrentUser: vi.fn().mockResolvedValue(null),
      onAuthStateChange: vi.fn().mockReturnValue(
        supabaseClientMock.auth.onAuthStateChange()
      )
    };

    routerMock = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: SupabaseService, useValue: supabaseMock },
        { provide: Router, useValue: routerMock }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with no user', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  describe('signUp', () => {
    it('should call Supabase signUp with correct parameters', async () => {
      const email = 'new@example.com';
      const password = 'password123';
      const name = 'New User';

      const mockResponse = {
        data: { user: mockUser, session: null },
        error: null
      };

      supabaseMock.client.auth.signUp.mockResolvedValue(mockResponse);

      const result = await service.signUp(email, password, name);

      expect(supabaseMock.client.auth.signUp).toHaveBeenCalledWith({
        email,
        password,
        options: { data: { name } }
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error when signUp fails', async () => {
      const mockError = new Error('Signup failed');
      supabaseMock.client.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      });

      await expect(
        service.signUp('test@test.com', 'password', 'Test')
      ).rejects.toThrow('Signup failed');
    });
  });

  describe('signIn', () => {
    it('should call Supabase signInWithPassword and update state', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const mockResponse = {
        data: { user: mockUser, session: { access_token: 'token' } as any },
        error: null
      };

      supabaseMock.client.auth.signInWithPassword.mockResolvedValue(mockResponse);

      const result = await service.signIn(email, password);

      expect(supabaseMock.client.auth.signInWithPassword).toHaveBeenCalledWith({
        email,
        password
      });
      expect(service.currentUser()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBe(true);
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error when signIn fails', async () => {
      const mockError = new Error('Invalid credentials');
      supabaseMock.client.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      });

      await expect(
        service.signIn('wrong@test.com', 'wrongpass')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('signOut', () => {
    it('should call Supabase signOut and navigate to login', async () => {
      supabaseMock.client.auth.signOut.mockResolvedValue({ error: null });

      await service.signOut();

      expect(supabaseMock.client.auth.signOut).toHaveBeenCalled();
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/auth/login']);
    });

    it('should throw error when signOut fails', async () => {
      const mockError = new Error('Signout failed');
      supabaseMock.client.auth.signOut.mockResolvedValue({ error: mockError });

      await expect(service.signOut()).rejects.toThrow('Signout failed');
    });
  });

  describe('state management', () => {
    it('should have readonly signals for currentUser and isAuthenticated', () => {
      // Signals should be readonly - attempting to set should throw
      expect(() => {
        (service.currentUser as any).set(mockUser);
      }).toThrow();

      expect(() => {
        (service.isAuthenticated as any).set(true);
      }).toThrow();
    });
  });
});
