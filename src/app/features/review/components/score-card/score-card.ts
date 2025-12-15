import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { PercentagePipe } from '../../../../shared/pipes/percentage-pipe';

@Component({
  selector: 'app-score-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressBarModule, MatIconModule, PercentagePipe],
  templateUrl: './score-card.html',
  styleUrl: './score-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScoreCardComponent {
  categoryName = input.required<string>();
  score = input.required<number>();
  color = input.required<string>();
  animationDelay = input<number>(0);
  belowThreshold = input<boolean>(false);

  getCategoryIcon(name: string): string {
    const iconMap: Record<string, string> = {
      Health: 'fitness_center',
      Learning: 'school',
      Creative: 'palette',
      Leisure: 'sports_esports',
      Project: 'work',
      Career: 'business_center',
    };
    return iconMap[name] || 'category';
  }
}
