import { Component, signal, inject, isDevMode } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav';
import { Footer } from './shared/components/footer/footer';
import { environment } from '../environments/environment';

// Load mock data utilities in dev mode with mock backend
if (isDevMode() && environment.useMockBackend) {
  import('./core/utils/mock-data-utils');
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BottomNavComponent, Footer],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('lazy-habbit-app');
  private readonly authService = inject(AuthService);

  // Expose auth state for template
  readonly isAuthenticated = this.authService.isAuthenticated;
}
