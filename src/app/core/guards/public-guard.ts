import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const publicGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // Wait for auth service initialization with timeout
    await Promise.race([
      authService.waitForInit(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth initialization timeout')), 5000)
      )
    ]);
  } catch (error) {
    // On error or timeout, allow access to public page
    return true;
  }

  const user = authService.currentUser();

  if (user) {
    // User is authenticated, redirect to dashboard
    router.navigate(['/dashboard']);
    return false;
  }

  // User is not authenticated, allow access to public page
  return true;
};
