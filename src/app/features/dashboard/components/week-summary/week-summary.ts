import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

interface WeekSummary {
  weekStart: string;
  weekEnd: string;
  completedHours: number;
  totalHours: number;
  completedTasks: number;
  totalTasks: number;
  overallProgress: number;
}

@Component({
  selector: 'app-week-summary',
  standalone: true,
  imports: [MatCardModule, MatProgressBarModule],
  templateUrl: './week-summary.html',
  styleUrl: './week-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeekSummaryComponent {
  summary = input.required<WeekSummary>();
}
