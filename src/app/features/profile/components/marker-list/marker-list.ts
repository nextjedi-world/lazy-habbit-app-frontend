import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressMarkerService } from '../../../../core/services/progress-marker';
import {
  MarkerWithLatestEntry,
  formatMarkerValue,
  formatRelativeTime,
  getTrendIcon,
} from '../../../../core/models/marker.model';

@Component({
  selector: 'app-marker-list',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './marker-list.html',
  styleUrl: './marker-list.scss',
})
export class MarkerListComponent {
  private readonly markerService = inject(ProgressMarkerService);

  // Outputs
  createMarker = output<void>();
  viewMarker = output<number>();

  // Expose service state
  markers = this.markerService.markers;
  isLoading = this.markerService.isLoading;
  hasMarkers = this.markerService.hasMarkers;

  // Helper methods
  formatValue(value: number, unit: string | null): string {
    return formatMarkerValue(value, unit);
  }

  formatLastEntry(entryDate: string): string {
    return formatRelativeTime(entryDate);
  }

  getTrendIcon(marker: MarkerWithLatestEntry): string {
    if (!marker.latest_entry) return '';
    // For now, show static icon (trend calculation requires historical data)
    return '→';
  }

  onCreateMarker(): void {
    this.createMarker.emit();
  }

  onViewMarker(markerId: number): void {
    this.viewMarker.emit(markerId);
  }

  // Group markers by category
  getMarkersByCategory(): Map<string, MarkerWithLatestEntry[]> {
    const grouped = new Map<string, MarkerWithLatestEntry[]>();

    for (const marker of this.markers()) {
      const categoryName = marker.category?.name || 'Uncategorized';
      const existing = grouped.get(categoryName) || [];
      grouped.set(categoryName, [...existing, marker]);
    }

    return grouped;
  }

  getCategoryColor(marker: MarkerWithLatestEntry): string {
    return marker.category?.color || '#757575';
  }

  getCategoryIcon(marker: MarkerWithLatestEntry): string {
    return marker.category?.icon || '📊';
  }
}
