import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'duration',
  standalone: true,
})
export class DurationPipe implements PipeTransform {
  transform(minutes: number): string {
    if (!minutes || minutes <= 0) {
      return '0m';
    }

    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);

    if (hours === 0) {
      return `${mins}m`;
    }

    if (mins === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${mins}m`;
  }
}
