import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { LoggingService } from '../../../../core/services/logging';
import { PlannedTaskWithCategory } from '../../../../core/models/plan.model';

@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [MatRippleModule, MatIconModule],
  templateUrl: './task-item.html',
  styleUrl: './task-item.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskItemComponent {
  private readonly loggingService = inject(LoggingService);

  // Inputs
  task = input.required<PlannedTaskWithCategory>();

  // Outputs
  taskTapped = output<number>();

  /**
   * Check if task is completed today
   */
  isCompletedToday(): boolean {
    return this.loggingService.isTaskCompleted(this.task().id);
  }

  /**
   * Get progress dots (filled/empty circles)
   */
  getProgressDots(): boolean[] {
    const task = this.task();
    const dots = Array(task.target_frequency).fill(false);
    for (let i = 0; i < task.completed_count && i < task.target_frequency; i++) {
      dots[i] = true;
    }
    return dots;
  }

  /**
   * Handle task tap
   */
  onTaskTap() {
    this.taskTapped.emit(this.task().id);
  }

  /**
   * Get ARIA label for accessibility
   */
  getAriaLabel(): string {
    const task = this.task();
    const status = this.isCompletedToday() ? 'completed today' : 'not completed today';
    return `${task.name}, ${task.completed_count} of ${task.target_frequency} times completed this week, ${status}`;
  }
}
