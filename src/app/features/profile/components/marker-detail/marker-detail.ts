import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  input,
  output,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { ProgressMarkerService } from '../../../../core/services/progress-marker';
import {
  MarkerWithLatestEntry,
  MarkerEntry,
  MarkerTrend,
  formatMarkerValue,
  formatRelativeTime,
  getTrendDirection,
  getTrendIcon,
} from '../../../../core/models/marker.model';

@Component({
  selector: 'app-marker-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './marker-detail.html',
  styleUrl: './marker-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkerDetail implements OnInit {
  private readonly markerService = inject(ProgressMarkerService);

  // Inputs
  marker = input.required<MarkerWithLatestEntry>();

  // Outputs
  editMarker = output<void>();
  deleteMarker = output<void>();
  addEntry = output<void>();
  editEntry = output<MarkerEntry>();

  // State
  entries = signal<MarkerEntry[]>([]);
  trend = signal<MarkerTrend | null>(null);
  isLoadingEntries = signal(false);
  isLoadingTrend = signal(false);
  hasMore = signal(false);
  currentPage = signal(0);
  readonly pageSize = 20;

  // Computed
  hasEntries = computed(() => this.entries().length > 0);
  totalEntries = signal(0);

  // Helper method for template
  formatValue(value: number): string {
    return formatMarkerValue(value, this.marker().unit);
  }

  formatDate(dateString: string): string {
    return formatRelativeTime(dateString);
  }

  getTrendIcon(): string {
    const trendData = this.trend();
    if (!trendData) return '';
    const direction = getTrendDirection(trendData.total_change);
    return getTrendIcon(direction);
  }

  getTrendText(): string {
    const trendData = this.trend();
    if (!trendData) return 'No trend data available';

    const change = trendData.total_change;
    const direction = getTrendDirection(change);
    const unit = this.marker().unit || '';

    if (direction === 'stable') {
      return `Stable (${this.formatValue(trendData.latest_value)})`;
    }

    const changeText =
      change > 0
        ? `+${formatMarkerValue(Math.abs(change), unit)}`
        : `-${formatMarkerValue(Math.abs(change), unit)}`;

    return `${changeText} over last 6 months`;
  }

  ngOnInit(): void {
    this.loadEntries();
    this.loadTrend();
  }

  async loadEntries(loadMore = false): Promise<void> {
    try {
      this.isLoadingEntries.set(true);

      const offset = loadMore ? this.currentPage() * this.pageSize : 0;
      const result = await this.markerService.getMarkerEntries(
        this.marker().id,
        this.pageSize,
        offset
      );

      if (loadMore) {
        this.entries.update((current) => [...current, ...result.entries]);
      } else {
        this.entries.set(result.entries);
      }

      this.totalEntries.set(result.total_count);
      this.hasMore.set(result.has_more);
      this.currentPage.update((page) => (loadMore ? page + 1 : 1));
    } catch (err) {
      console.error('Error loading entries:', err);
    } finally {
      this.isLoadingEntries.set(false);
    }
  }

  async loadTrend(): Promise<void> {
    try {
      this.isLoadingTrend.set(true);
      const trendData = await this.markerService.getMarkerTrend(
        this.marker().id,
        6
      );
      this.trend.set(trendData);
    } catch (err) {
      console.error('Error loading trend:', err);
    } finally {
      this.isLoadingTrend.set(false);
    }
  }

  onLoadMore(): void {
    this.loadEntries(true);
  }

  onEditMarker(): void {
    this.editMarker.emit();
  }

  onDeleteMarker(): void {
    if (
      confirm(
        `Are you sure you want to delete "${this.marker().name}"? All entries will be permanently deleted.`
      )
    ) {
      this.deleteMarker.emit();
    }
  }

  onAddEntry(): void {
    this.addEntry.emit();
  }

  onEditEntry(entry: MarkerEntry): void {
    this.editEntry.emit(entry);
  }

  async onDeleteEntry(entry: MarkerEntry): Promise<void> {
    if (
      confirm(
        `Delete entry from ${entry.entry_date}? This cannot be undone.`
      )
    ) {
      try {
        await this.markerService.deleteEntry(entry.id);
        // Reload entries and trend
        await Promise.all([this.loadEntries(), this.loadTrend()]);
      } catch (err) {
        console.error('Error deleting entry:', err);
        alert('Failed to delete entry. Please try again.');
      }
    }
  }
}
