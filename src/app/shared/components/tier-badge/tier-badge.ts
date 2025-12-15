import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

type BadgeSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-tier-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tier-badge.html',
  styleUrl: './tier-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TierBadgeComponent {
  // Inputs
  tier = input.required<number>();
  size = input<BadgeSize>('medium');

  // Computed values
  tierGradient = computed(() => {
    const t = this.tier();
    if (t <= 2) return 'gradient-low';
    if (t <= 5) return 'gradient-mid';
    if (t <= 8) return 'gradient-high';
    return 'gradient-elite';
  });

  tierLabel = computed(() => {
    return `Tier ${this.tier()}`;
  });

  ariaLabel = computed(() => {
    return `Current tier level ${this.tier()} out of 10`;
  });
}
