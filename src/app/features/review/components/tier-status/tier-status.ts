import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-tier-status',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './tier-status.html',
  styleUrl: './tier-status.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TierStatusComponent {
  track = input.required<'promotion' | 'stable' | 'demotion'>();
  consecutiveWeeks = input.required<number>();

  // Computed values
  trackIcon = computed(() => {
    const trackMap = {
      promotion: 'trending_up',
      stable: 'remove',
      demotion: 'trending_down',
    };
    return trackMap[this.track()];
  });

  trackLabel = computed(() => {
    const labelMap = {
      promotion: 'On Promotion Track',
      stable: 'Stable Performance',
      demotion: 'On Demotion Track',
    };
    return labelMap[this.track()];
  });

  trackDescription = computed(() => {
    const weeks = this.consecutiveWeeks();
    const remaining = 3 - weeks;
    const descMap = {
      promotion:
        remaining === 0
          ? 'Congratulations! You will be promoted to the next tier.'
          : `${remaining} more ${remaining === 1 ? 'week' : 'weeks'} to tier promotion!`,
      stable: 'Keep up the consistent effort to maintain your tier.',
      demotion:
        remaining === 0
          ? 'You will be demoted to the previous tier.'
          : `${remaining} more ${remaining === 1 ? 'week' : 'weeks'} until tier demotion.`,
    };
    return descMap[this.track()];
  });

  progressDots = computed(() => {
    const weeks = this.consecutiveWeeks();
    return [
      { filled: weeks >= 1, label: 'Week 1' },
      { filled: weeks >= 2, label: 'Week 2' },
      { filled: weeks >= 3, label: 'Week 3' },
    ];
  });
}
