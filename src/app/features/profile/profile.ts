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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { UserService } from '../../core/services/user';
import { AuthService } from '../../core/services/auth';
import { ScoreService } from '../../core/services/score';
import { ProgressMarkerService } from '../../core/services/progress-marker';
import { Logger } from '../../core/services/logger';
import { UserProfile, TierHistory } from '../../core/models/user.model';
import { WeeklyScore } from '../../core/models/score.model';
import { MarkerWithLatestEntry, MarkerEntry, ProgressMarker } from '../../core/models/marker.model';
import { TierGraphComponent } from './components/tier-graph/tier-graph';
import { PercentagePipe } from '../../shared/pipes/percentage-pipe';
import { MarkerListComponent } from './components/marker-list/marker-list';
import { MarkerForm } from './components/marker-form/marker-form';
import { MarkerEntryForm } from './components/marker-entry-form/marker-entry-form';
import { MarkerDetail } from './components/marker-detail/marker-detail';

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
    MatSnackBarModule,
    MatTabsModule,
    TierGraphComponent,
    PercentagePipe,
    MarkerListComponent,
    MarkerForm,
    MarkerEntryForm,
    MarkerDetail,
  ],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private scoreService = inject(ScoreService);
  private markerService = inject(ProgressMarkerService);
  private logger = inject(Logger);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Profile Signals
  loading = signal(false);
  user = signal<UserProfile | null>(null);
  tierHistory = signal<TierHistory[]>([]);
  recentScores = signal<WeeklyScore[]>([]);
  stats = signal<UserStats | null>(null);
  darkMode = signal(false);

  // Progress Markers Signals
  selectedTab = signal(0);
  currentView = signal<'list' | 'create' | 'edit' | 'detail' | 'add-entry' | 'edit-entry'>('list');
  selectedMarker = signal<MarkerWithLatestEntry | null>(null);
  selectedEntry = signal<MarkerEntry | null>(null);
  markerToEdit = signal<ProgressMarker | null>(null);

  // Access marker service state
  markers = this.markerService.markers;
  markersLoading = this.markerService.isLoading;
  markersError = this.markerService.error;

  // Computed
  currentTier = computed(() => this.user()?.current_tier ?? 0);
  tierGradient = computed(() => this.getTierGradient(this.currentTier()));
  displayedColumns = ['week', 'score'];

  async ngOnInit() {
    try {
      this.loading.set(true);
      await this.loadUserProfile();
    } catch (error) {
      this.logger.error('Failed to load profile data:', error);

      const snackBarRef = this.snackBar.open(
        'Failed to load profile data. Please try again.',
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

  async loadUserProfile() {
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
  }

  private async calculateStats(userId: string) {
    try {
      // Fetch all scores to calculate stats
      const allScores = await this.scoreService.loadAllScores(userId);

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
      this.logger.error('Failed to calculate stats:', error);
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
      this.logger.error('Logout failed:', error);
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

  // Progress Markers Methods

  async onTabChange(index: number) {
    this.selectedTab.set(index);

    // Load markers when switching to Progress Markers tab
    if (index === 1) {
      try {
        await this.markerService.loadUserMarkers();
      } catch (error) {
        this.logger.error('Failed to load markers:', error);
        this.snackBar.open('Failed to load progress markers', 'Dismiss', {
          duration: 3000,
        });
      }
    }
  }

  onCreateMarker() {
    this.currentView.set('create');
    this.markerToEdit.set(null);
  }

  onViewMarker(markerId: number) {
    const marker = this.markers().find(m => m.id === markerId);
    if (marker) {
      this.selectedMarker.set(marker);
      this.currentView.set('detail');
    }
  }

  onEditMarker(marker?: ProgressMarker) {
    if (marker) {
      this.markerToEdit.set(marker);
    } else if (this.selectedMarker()) {
      this.markerToEdit.set(this.selectedMarker()!);
    }
    this.currentView.set('edit');
  }

  async onDeleteMarker() {
    if (!this.selectedMarker()) return;

    try {
      await this.markerService.deleteMarker(this.selectedMarker()!.id);
      this.snackBar.open('Marker deleted successfully', 'Dismiss', {
        duration: 3000,
      });
      this.currentView.set('list');
      this.selectedMarker.set(null);
    } catch (error) {
      this.logger.error('Failed to delete marker:', error);
      this.snackBar.open('Failed to delete marker', 'Dismiss', {
        duration: 3000,
      });
    }
  }

  onAddEntry() {
    this.selectedEntry.set(null);
    this.currentView.set('add-entry');
  }

  onEditEntry(entry: MarkerEntry) {
    this.selectedEntry.set(entry);
    this.currentView.set('edit-entry');
  }

  async onMarkerFormSubmit(marker: ProgressMarker) {
    this.snackBar.open(
      `Marker "${marker.name}" ${this.currentView() === 'edit' ? 'updated' : 'created'} successfully`,
      'Dismiss',
      { duration: 3000 }
    );
    this.currentView.set('list');
    this.markerToEdit.set(null);
  }

  onMarkerFormCancel() {
    this.currentView.set('list');
    this.markerToEdit.set(null);
  }

  async onEntryFormSubmit(entry: MarkerEntry) {
    this.snackBar.open(
      `Entry ${this.currentView() === 'edit-entry' ? 'updated' : 'logged'} successfully`,
      'Dismiss',
      { duration: 3000 }
    );

    // Return to detail view if we came from there
    if (this.selectedMarker()) {
      this.currentView.set('detail');
      // Refresh the marker to show updated latest entry
      const refreshedMarker = await this.markerService.getMarkerById(this.selectedMarker()!.id);
      if (refreshedMarker) {
        this.selectedMarker.set(refreshedMarker);
      }
    } else {
      this.currentView.set('list');
    }
    this.selectedEntry.set(null);
  }

  onEntryFormCancel() {
    // Return to detail view if we came from there, otherwise list
    if (this.selectedMarker()) {
      this.currentView.set('detail');
    } else {
      this.currentView.set('list');
    }
    this.selectedEntry.set(null);
  }

  onBackToList() {
    this.currentView.set('list');
    this.selectedMarker.set(null);
    this.selectedEntry.set(null);
    this.markerToEdit.set(null);
  }
}
