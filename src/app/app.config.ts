import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { AuthService } from './core/services/auth';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimations(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    }),
    // Initialize auth before app boots (restores session from localStorage)
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: AuthService) => async () => {
        // Wait for auth to initialize (restores session from localStorage)
        await authService.waitForInit();
      },
      deps: [AuthService],
      multi: true
    }
  ]
};
