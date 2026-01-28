import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

// Category icon mapping
const CATEGORY_ICONS: Record<string, string> = {
  'Health': 'fitness_center',
  'Learning': 'school',
  'Creative': 'palette',
  'Leisure': 'sports_esports',
  'Project': 'build',
  'Career': 'work'
};

@Component({
  selector: 'app-category-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-card.html',
  styleUrl: './category-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryCardComponent {
  // Inputs
  categoryName = input.required<string>();
  progress = input.required<number>(); // 0-1 range
  color = input<string>('#3b82f6');

  // Computed values
  icon = computed(() => {
    return CATEGORY_ICONS[this.categoryName()] || 'category';
  });

  progressPercentage = computed(() => {
    return Math.round(this.progress() * 100);
  });

  progressWidth = computed(() => {
    return `${this.progressPercentage()}%`;
  });

  ariaLabel = computed(() => {
    return `${this.categoryName()} category: ${this.progressPercentage()}% complete`;
  });

  progressBarStyles = computed(() => {
    return {
      width: this.progressWidth(),
      backgroundColor: this.color()
    };
  });
}
