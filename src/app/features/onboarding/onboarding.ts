import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../core/services/auth';
import { UserService } from '../../core/services/user';
import { Logger } from '../../core/services/logger';

/**
 * Onboarding component for first-time users
 * Multi-step wizard introducing Lazy Habbit concept, tier system, and planning
 *
 * Critical Business Rules:
 * - Onboarding is required before accessing the app
 * - Users can skip onboarding but are encouraged to complete it
 * - Onboarding completion is stored in localStorage
 * - Shows 3 steps: Welcome, Tier System, Planning Guide
 */
@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatStepperModule,
    MatProgressBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.scss',
})
export class OnboardingComponent {
  // Services
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly logger = inject(Logger);

  // State
  currentStep = signal(0);
  isCompleting = signal(false);

  // Total steps
  readonly totalSteps = 3;

  /**
   * Navigate to next step
   */
  nextStep(): void {
    if (this.currentStep() < this.totalSteps - 1) {
      this.currentStep.update(step => step + 1);
    }
  }

  /**
   * Navigate to previous step
   */
  previousStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update(step => step - 1);
    }
  }

  /**
   * Skip onboarding (allow user to proceed without completing)
   */
  async skipOnboarding(): Promise<void> {
    this.isCompleting.set(true);
    try {
      // Mark onboarding as skipped in localStorage
      localStorage.setItem('onboarding_skipped', 'true');
      this.logger.log('User skipped onboarding');

      await this.router.navigate(['/planning']);
    } catch (error) {
      this.logger.error('Failed to skip onboarding:', error);
    } finally {
      this.isCompleting.set(false);
    }
  }

  /**
   * Complete onboarding and navigate to planning
   */
  async completeOnboarding(): Promise<void> {
    this.isCompleting.set(true);
    try {
      // Mark onboarding as completed
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.removeItem('onboarding_skipped');

      this.logger.log('User completed onboarding');

      // Navigate to planning to create first weekly plan
      await this.router.navigate(['/planning']);
    } catch (error) {
      this.logger.error('Failed to complete onboarding:', error);
    } finally {
      this.isCompleting.set(false);
    }
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    return ((this.currentStep() + 1) / this.totalSteps) * 100;
  }
}
