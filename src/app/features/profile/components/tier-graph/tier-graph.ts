import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TierHistory } from '../../../../core/models/user.model';

interface GraphPoint {
  x: number;
  y: number;
  tier: number;
  date: string;
}

@Component({
  selector: 'app-tier-graph',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tier-graph.html',
  styleUrl: './tier-graph.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TierGraphComponent {
  tierHistory = input.required<TierHistory[]>();

  // Graph dimensions
  private readonly width = 600;
  private readonly height = 300;
  private readonly padding = 40;
  private readonly maxTier = 10;

  // Computed values
  graphPoints = computed(() => {
    const history = this.tierHistory();
    if (history.length === 0) return [];

    // Reverse to show oldest first
    const sortedHistory = [...history].reverse();

    // Calculate x-scale
    const chartWidth = this.width - 2 * this.padding;
    const xStep = chartWidth / Math.max(1, sortedHistory.length - 1);

    // Map to graph points
    return sortedHistory.map((entry, index) => ({
      x: this.padding + index * xStep,
      y: this.height - this.padding - (entry.new_tier / this.maxTier) * (this.height - 2 * this.padding),
      tier: entry.new_tier,
      date: this.formatDate(entry.changed_at),
    }));
  });

  pathData = computed(() => {
    const points = this.graphPoints();
    if (points.length === 0) return '';

    return points.map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command} ${point.x} ${point.y}`;
    }).join(' ');
  });

  viewBox = computed(() => `0 0 ${this.width} ${this.height}`);

  // Y-axis labels (tiers 0-10)
  yAxisLabels = computed(() => {
    const labels = [];
    for (let tier = 0; tier <= this.maxTier; tier++) {
      const y = this.height - this.padding - (tier / this.maxTier) * (this.height - 2 * this.padding);
      labels.push({
        tier,
        y,
        x: this.padding - 10,
      });
    }
    return labels;
  });

  // Grid lines
  gridLines = computed(() => {
    const lines = [];
    for (let tier = 0; tier <= this.maxTier; tier++) {
      const y = this.height - this.padding - (tier / this.maxTier) * (this.height - 2 * this.padding);
      lines.push({
        tier,
        y,
        x1: this.padding,
        x2: this.width - this.padding,
      });
    }
    return lines;
  });

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  getTierColor(tier: number): string {
    if (tier <= 2) return '#60a5fa'; // Light Blue
    if (tier <= 5) return '#3b82f6'; // Blue
    if (tier <= 8) return '#8b5cf6'; // Purple
    return '#fbbf24'; // Gold
  }
}
