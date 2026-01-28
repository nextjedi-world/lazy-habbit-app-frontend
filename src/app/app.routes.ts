import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { publicGuard } from './core/guards/public-guard';

export const routes: Routes = [
  // Legal pages (public, no auth required) - MUST be first!
  {
    path: 'privacy-policy',
    loadComponent: () => import('./features/legal/privacy-policy/privacy-policy').then(m => m.PrivacyPolicyComponent),
  },
  {
    path: 'terms-of-service',
    loadComponent: () => import('./features/legal/terms-of-service/terms-of-service').then(m => m.TermsOfServiceComponent),
  },

  // Landing page (public, redirect authenticated users to dashboard)
  {
    path: '',
    loadComponent: () => import('./features/landing/landing').then(m => m.LandingComponent),
    canActivate: [publicGuard],
  },

  // Auth routes under /auth prefix
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent),
    canActivate: [publicGuard],
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent),
    canActivate: [publicGuard],
  },

  // Protected routes
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'planning',
    loadComponent: () => import('./features/planning/planning').then(m => m.PlanningComponent),
    canActivate: [authGuard],
  },
  {
    path: 'review',
    loadComponent: () => import('./features/review/review').then(m => m.ReviewComponent),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile').then(m => m.ProfileComponent),
    canActivate: [authGuard],
  },

  // Redirect legacy paths for compatibility
  {
    path: 'login',
    redirectTo: '/auth/login',
    pathMatch: 'full',
  },
  {
    path: 'register',
    redirectTo: '/auth/register',
    pathMatch: 'full',
  },

  // 404 fallback
  {
    path: '**',
    redirectTo: '',
  },
];
