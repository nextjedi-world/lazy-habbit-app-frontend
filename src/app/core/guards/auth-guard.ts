import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to initialize (restores session from localStorage)
  await authService.waitForInit();

  const user = authService.currentUser();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
