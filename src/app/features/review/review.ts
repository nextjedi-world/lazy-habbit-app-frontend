import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ScoreService } from '../../core/services/score';
import { AuthService } from '../../core/services/auth';
import { PlanService } from '../../core/services/plan';
import { UserService } from '../../core/services/user';
import { Logger } from '../../core/services/logger';
import { WeeklyScore } from '../../core/models/score.model';
import { PercentagePipe } from '../../shared/pipes/percentage-pipe';
import { ScoreCardComponent } from './components/score-card/score-card';
import { TierStatusComponent } from './components/tier-status/tier-status';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatBadgeModule,
    MatSnackBarModule,
    PercentagePipe,
    ScoreCardComponent,
    TierStatusComponent,
  ],
  templateUrl: './review.html',
  styleUrl: './review.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewComponent implements OnInit {
  private readonly scoreService = inject(ScoreService);
  private readonly authService = inject(AuthService);
  private readonly planService = inject(PlanService);
  private readonly userService = inject(UserService);
  private readonly logger = inject(Logger);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  // State signals
  loading = signal(false);
  weeklyScore = signal<WeeklyScore | null>(null);
  error = signal<string | null>(null);
  showConfetti = signal(false);

  // Computed values
  tierStatus = computed(() => {
    const track = this.scoreService.tierTrack();
    if (!track) return null;
    return {
      track: track.track,
      consecutiveWeeks: track.consecutiveWeeks,
    };
  });

  isCleanWeek = computed(() => {
    const score = this.weeklyScore();
    return score?.is_clean ?? false;
  });

  categoryScores = computed(() => {
    return this.weeklyScore()?.category_scores ?? [];
  });

  async ngOnInit() {
    try {
      this.loading.set(true);
      await this.loadWeekReview();
    } catch (error) {
      this.logger.error('Failed to load review data:', error);

      const snackBarRef = this.snackBar.open(
        'Failed to load review data. Please try again.',
        'Retry',
        {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        }
      );

      snackBarRef.onAction().subscribe(() => {
        this.ngOnInit(); // Retry on button click
      });
    } finally {
      this.loading.set(false);
    }
  }

  async loadWeekReview(): Promise<void> {
    this.error.set(null);

    const user = this.authService.currentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Load current week plan
    const activePlan = this.planService.activePlan();
    if (!activePlan) {
      // Try to load active plan
      await this.planService.loadActivePlan(user.id);
      const plan = this.planService.activePlan();
      if (!plan) {
        throw new Error('No active plan found');
      }
    }

    const plan = this.planService.activePlan()!;

    // Load tasks for the plan
    await this.planService.loadPlannedTasks(plan.id);
    const tasks = this.planService.plannedTasks();

    // Load categories
    await this.userService.loadCategories(user.id);
    const categories = this.userService.categories();

    // Calculate score
    const scoreData = this.scoreService.calculateScore(tasks, categories);

    // Save score to database
    await this.scoreService.saveWeeklyScore(
      user.id,
      plan.id,
      plan.week_start_date,
      scoreData
    );

    // Load recent scores for tier tracking
    await this.scoreService.loadRecentScores(user.id, 3);

    // Set current score
    const score = this.scoreService.currentScore();
    this.weeklyScore.set(score);

    // Show confetti if on promotion track
    const track = this.tierStatus();
    if (track?.track === 'promotion') {
      this.showConfetti.set(true);
      setTimeout(() => this.showConfetti.set(false), 5000);
    }
  }

  navigateToPlanning(): void {
    this.router.navigate(['/planning']);
  }

  getScoreColor(score: number): string {
    if (score >= 0.8) return 'var(--color-promotion)';
    if (score >= 0.6) return 'var(--color-stable)';
    return 'var(--color-demotion)';
  }

  getCategoryColor(index: number): string {
    const colors = [
      '#FF6B6B', // Health - Red
      '#4ECDC4', // Learning - Teal
      '#FFD93D', // Creative - Yellow
      '#95E1D3', // Leisure - Mint
      '#A78BFA', // Project - Purple
      '#60A5FA', // Career - Blue
    ];
    return colors[index % colors.length];
  }
}
