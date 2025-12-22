import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { signal } from '@angular/core';

import { publicGuard } from './public-guard';
import { AuthService } from '../services/auth';

describe('publicGuard', () => {
  let mockAuthService: any;
  let mockRouter: any;

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => publicGuard(...guardParameters));

  beforeEach(() => {
    // Create mock auth service with signals
    mockAuthService = {
      currentUser: signal(null),
      waitForInit: vi.fn().mockResolvedValue(undefined)
    };

    // Create mock router
    mockRouter = {
      navigate: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should redirect authenticated users to /dashboard', async () => {
    // Mock authenticated user
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockAuthService.currentUser = signal(mockUser);
    mockAuthService.waitForInit.mockResolvedValue(undefined);

    const result = await executeGuard({} as any, {} as any);

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(result).toBe(false);
  });

  it('should allow unauthenticated users to access public page', async () => {
    // Mock no user (not authenticated)
    mockAuthService.currentUser = signal(null);
    mockAuthService.waitForInit.mockResolvedValue(undefined);

    const result = await executeGuard({} as any, {} as any);

    expect(mockRouter.navigate).not.toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should allow access on auth initialization timeout', async () => {
    // Mock a promise that never resolves to simulate timeout
    // The guard has its own 5-second timeout that will trigger
    mockAuthService.waitForInit.mockReturnValue(
      new Promise(() => {
        // Promise never resolves or rejects, simulating a hang
      })
    );

    const result = await executeGuard({} as any, {} as any);

    expect(result).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  }, 10000); // Set test timeout to 10 seconds

  it('should allow access on auth service error', async () => {
    // Mock error during initialization
    mockAuthService.waitForInit.mockRejectedValue(new Error('Auth service error'));

    const result = await executeGuard({} as any, {} as any);

    expect(result).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
