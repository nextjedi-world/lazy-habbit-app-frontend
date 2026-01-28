import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

type SpinnerSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading-spinner.html',
  styleUrl: './loading-spinner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingSpinnerComponent {
  // Inputs
  size = input<SpinnerSize>('medium');
  color = input<string>('#3b82f6');

  // Computed values
  diameter = computed(() => {
    const sizeMap = {
      small: 24,
      medium: 40,
      large: 60
    };
    return sizeMap[this.size()];
  });

  strokeWidth = computed(() => {
    const widthMap = {
      small: 3,
      medium: 4,
      large: 5
    };
    return widthMap[this.size()];
  });

  spinnerStyles = computed(() => {
    return {
      width: `${this.diameter()}px`,
      height: `${this.diameter()}px`,
      borderColor: `${this.color()}33`,
      borderTopColor: this.color(),
      borderWidth: `${this.strokeWidth()}px`
    };
  });
}
