import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-dots',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-dots.html',
  styleUrl: './progress-dots.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressDotsComponent {
  // Inputs
  total = input.required<number>();
  completed = input.required<number>();

  // Computed values
  completedArray = computed(() => {
    const count = Math.min(this.completed(), this.total());
    return Array(count).fill(0);
  });

  remainingArray = computed(() => {
    const count = Math.max(0, this.total() - this.completed());
    return Array(count).fill(0);
  });

  ariaLabel = computed(() => {
    return `${this.completed()} of ${this.total()} tasks completed`;
  });
}
