import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Category } from '../../../../core/models/user.model';
import { PlannedTaskWithCategory } from '../../../../core/models/plan.model';
import { TaskItemComponent } from '../task-item/task-item';

// Category color mapping (6 default categories)
const CATEGORY_COLORS: Record<string, string> = {
  'Health': '#ef4444',      // Red
  'Learning': '#3b82f6',    // Blue
  'Creative': '#8b5cf6',    // Purple
  'Leisure': '#10b981',     // Green
  'Project': '#f59e0b',     // Orange
  'Career': '#06b6d4'       // Cyan
};

const CATEGORY_ICONS: Record<string, string> = {
  'Health': 'fitness_center',
  'Learning': 'school',
  'Creative': 'palette',
  'Leisure': 'sports_esports',
  'Project': 'construction',
  'Career': 'work'
};

@Component({
  selector: 'app-category-section',
  standalone: true,
  imports: [DecimalPipe, MatIconModule, MatProgressBarModule, TaskItemComponent],
  templateUrl: './category-section.html',
  styleUrl: './category-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategorySectionComponent {
  // Inputs
  category = input.required<Category>();
  tasks = input.required<PlannedTaskWithCategory[]>();
  progress = input.required<number>();

  // Outputs
  taskTapped = output<number>();

  /**
   * Get category color
   */
  getCategoryColor(): string {
    return CATEGORY_COLORS[this.category().name] || '#6b7280';
  }

  /**
   * Get category icon
   */
  getCategoryIcon(): string {
    return CATEGORY_ICONS[this.category().name] || 'category';
  }

  /**
   * Handle task tap event
   */
  onTaskTap(taskId: number) {
    this.taskTapped.emit(taskId);
  }
}
