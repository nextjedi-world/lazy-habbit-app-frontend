import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { UserService } from '../../core/services/user';
import { AuthService } from '../../core/services/auth';
import { ScoreService } from '../../core/services/score';
import { UserProfile, TierHistory } from '../../core/models/user.model';
import { WeeklyScore } from '../../core/models/score.model';
import { TierGraphComponent } from './components/tier-graph/tier-graph';
import { PercentagePipe } from '../../shared/pipes/percentage-pipe';

interface UserStats {
  totalWeeks: number;
  cleanWeeks: number;
  currentStreak: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTableModule,
    TierGraphComponent,
    PercentagePipe,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private scoreService = inject(ScoreService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  // Signals
  loading = signal(false);
  user = signal<UserProfile | null>(null);
  tierHistory = signal<TierHistory[]>([]);
  recentScores = signal<WeeklyScore[]>([]);
  stats = signal<UserStats | null>(null);
  darkMode = signal(false);

  // Computed
  currentTier = computed(() => this.user()?.current_tier ?? 0);
  tierGradient = computed(() => this.getTierGradient(this.currentTier()));
  displayedColumns = ['week', 'score'];

  async ngOnInit() {
    await this.loadUserProfile();
  }

  async loadUserProfile() {
    this.loading.set(true);
    try {
      const currentUser = this.authService.currentUser();
      if (!currentUser) {
        this.router.navigate(['/auth/login']);
        return;
      }

      // Load user profile
      await this.userService.loadProfile(currentUser.id);
      this.user.set(this.userService.profile());

      // Load tier history
      await this.userService.loadTierHistory(currentUser.id);
      this.tierHistory.set(this.userService.tierHistory());

      // Load recent scores (last 4 weeks)
      await this.scoreService.loadRecentScores(currentUser.id, 4);
      this.recentScores.set(this.scoreService.recentScores());

      // Calculate stats
      await this.calculateStats(currentUser.id);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private async calculateStats(userId: string) {
    try {
      // Fetch all scores to calculate stats
      const { data, error } = await this.userService['supabase'].client
        .from('weekly_scores')
        .select('*')
        .eq('user_id', userId)
        .order('week_start_date', { ascending: false });

      if (error) throw error;

      const allScores = data || [];
      const totalWeeks = allScores.length;
      const cleanWeeks = allScores.filter(s => s.is_clean).length;

      // Calculate current streak (consecutive clean weeks from most recent)
      let currentStreak = 0;
      for (const score of allScores) {
        if (score.is_clean) {
          currentStreak++;
        } else {
          break;
        }
      }

      this.stats.set({
        totalWeeks,
        cleanWeeks,
        currentStreak,
      });
    } catch (error) {
      console.error('Failed to calculate stats:', error);
      this.stats.set({
        totalWeeks: 0,
        cleanWeeks: 0,
        currentStreak: 0,
      });
    }
  }

  getTierGradient(tier: number): string {
    if (tier <= 2) return 'linear-gradient(135deg, #9ca3af 0%, #60a5fa 100%)'; // Gray → Light Blue
    if (tier <= 5) return 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'; // Light Blue → Blue
    if (tier <= 8) return 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'; // Blue → Purple
    return 'linear-gradient(135deg, #8b5cf6 0%, #fbbf24 100%)'; // Purple → Gold
  }

  toggleDarkMode() {
    const newMode = !this.darkMode();
    this.darkMode.set(newMode);
    // TODO: Implement theme service to persist preference
    document.body.classList.toggle('dark-theme', newMode);
  }

  openLogoutDialog() {
    import('./components/logout-dialog/logout-dialog').then(({ LogoutDialogComponent }) => {
      const dialogRef = this.dialog.open(LogoutDialogComponent, {
        width: '400px',
      });

      dialogRef.afterClosed().subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.logout();
        }
      });
    });
  }

  async logout() {
    try {
      await this.authService.signOut();
      this.userService.clearState();
      this.scoreService.clearState();
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  formatWeekDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
}
