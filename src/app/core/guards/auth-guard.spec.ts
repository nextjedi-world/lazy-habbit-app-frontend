import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth-guard';
import { AuthService } from '../services/auth';
import { signal } from '@angular/core';

describe('authGuard', () => {
  let mockAuthService: any;
  let mockRouter: any;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    // Create mock AuthService
    mockAuthService = {
      waitForInit: vi.fn(),
      currentUser: signal(null)
    };

    // Create mock Router
    mockRouter = {
      navigate: vi.fn()
    };

    // Create mock route and state
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/dashboard' } as RouterStateSnapshot;

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('successful authentication', () => {
    it('should allow navigation when user is authenticated', async () => {
      // Setup: Auth initializes quickly and user is logged in
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockAuthService.currentUser = signal(mockUser as any);
      mockAuthService.waitForInit.mockResolvedValue(undefined);

      const result = await TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
      expect(mockAuthService.waitForInit).toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('unauthenticated user', () => {
    it('should redirect to login when user is not authenticated', async () => {
      // Setup: Auth initializes but no user is logged in
      mockAuthService.currentUser = signal(null);
      mockAuthService.waitForInit.mockResolvedValue(undefined);

      const result = await TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/auth/login'],
        { queryParams: { returnUrl: '/dashboard' } }
      );
    });

    it('should preserve return URL in query params', async () => {
      // Setup: Different protected route
      mockState = { url: '/profile' } as RouterStateSnapshot;
      mockAuthService.currentUser = signal(null);
      mockAuthService.waitForInit.mockResolvedValue(undefined);

      const result = await TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/auth/login'],
        { queryParams: { returnUrl: '/profile' } }
      );
    });
  });

  describe('timeout handling', () => {
    it('should timeout after 5 seconds and redirect to login', async () => {
      // Setup: Auth initialization hangs indefinitely
      mockAuthService.currentUser = signal(null);
      mockAuthService.waitForInit.mockReturnValue(
        new Promise(() => {}) // Never resolves
      );

      // Spy on console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Use fake timers
      vi.useFakeTimers();

      // Start the guard execution
      const guardPromise = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      // Fast-forward time by 5 seconds
      await vi.advanceTimersByTimeAsync(5001);

      const result = await guardPromise;

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/auth/login'],
        { queryParams: { returnUrl: '/dashboard' } }
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Auth guard error:',
        expect.any(Error)
      );

      vi.useRealTimers();
      consoleErrorSpy.mockRestore();
    });

    it('should not timeout if auth initializes within 5 seconds', async () => {
      // Setup: Auth takes 3 seconds to initialize
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockAuthService.currentUser = signal(mockUser as any);

      vi.useFakeTimers();

      mockAuthService.waitForInit.mockReturnValue(
        new Promise(resolve => setTimeout(resolve, 3000))
      );

      // Start the guard execution
      const guardPromise = TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      // Fast-forward by 3 seconds
      await vi.advanceTimersByTimeAsync(3000);

      const result = await guardPromise;

      expect(result).toBe(true);
      expect(mockRouter.navigate).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('error handling', () => {
    it('should redirect to login when auth initialization fails', async () => {
      // Setup: Auth initialization throws error
      mockAuthService.currentUser = signal(null);
      mockAuthService.waitForInit.mockRejectedValue(new Error('Network error'));

      // Spy on console.error to suppress error output
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/auth/login'],
        { queryParams: { returnUrl: '/dashboard' } }
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Auth guard error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should preserve return URL when error occurs', async () => {
      // Setup: Auth initialization fails on protected route
      mockState = { url: '/review' } as RouterStateSnapshot;
      mockAuthService.currentUser = signal(null);
      mockAuthService.waitForInit.mockRejectedValue(new Error('Auth failed'));

      // Suppress console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/auth/login'],
        { queryParams: { returnUrl: '/review' } }
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle root URL correctly', async () => {
      // Setup: User trying to access root
      mockState = { url: '/' } as RouterStateSnapshot;
      mockAuthService.currentUser = signal(null);
      mockAuthService.waitForInit.mockResolvedValue(undefined);

      const result = await TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/auth/login'],
        { queryParams: { returnUrl: '/' } }
      );
    });

    it('should handle URL with query params correctly', async () => {
      // Setup: User trying to access URL with existing query params
      mockState = { url: '/dashboard?filter=active' } as RouterStateSnapshot;
      mockAuthService.currentUser = signal(null);
      mockAuthService.waitForInit.mockResolvedValue(undefined);

      const result = await TestBed.runInInjectionContext(() =>
        authGuard(mockRoute, mockState)
      );

      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/auth/login'],
        { queryParams: { returnUrl: '/dashboard?filter=active' } }
      );
    });
  });
});
