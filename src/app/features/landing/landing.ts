import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
  private router = inject(Router);

  navigateToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  readonly stats = [
    {
      icon: 'schedule',
      value: '3-week',
      label: 'Buffer System',
      description: 'Bad weeks don\'t derail your progress'
    },
    {
      icon: 'trending_up',
      value: '0-10',
      label: 'Tier Progression',
      description: 'Gamification without burnout'
    },
    {
      icon: 'timer',
      value: '25-35hrs',
      label: 'Weekly Focus',
      description: 'Success without overwhelm'
    }
  ];
}
