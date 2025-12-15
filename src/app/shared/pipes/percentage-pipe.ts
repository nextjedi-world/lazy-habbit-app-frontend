import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'percentage',
  standalone: true,
})
export class PercentagePipe implements PipeTransform {
  transform(value: number, decimals = 0): string {
    if (value === null || value === undefined) {
      return '0%';
    }

    const percentage = value * 100;
    return `${percentage.toFixed(decimals)}%`;
  }
}
