import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav';
import { Footer } from './shared/components/footer/footer';

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
