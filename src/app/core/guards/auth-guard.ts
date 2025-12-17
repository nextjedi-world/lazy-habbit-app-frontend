import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // Wait max 5 seconds for auth initialization
    await Promise.race([
      authService.waitForInit(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth initialization timeout')), 5000)
      )
    ]);
  } catch (error) {
    console.error('Auth guard error:', error);
    // Redirect to login on timeout or error
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  // Check if user is authenticated
  const user = authService.currentUser();

  if (!user) {
    router.navigate(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  return true;
};
