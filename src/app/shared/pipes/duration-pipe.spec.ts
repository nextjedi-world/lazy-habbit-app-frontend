import { describe, it, expect, beforeEach } from 'vitest';
import { DurationPipe } from './duration-pipe';

describe('DurationPipe', () => {
  let pipe: DurationPipe;

  beforeEach(() => {
    pipe = new DurationPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('transform', () => {
    it('should convert minutes to "Xm" format when less than 60', () => {
      expect(pipe.transform(30)).toBe('30m');
      expect(pipe.transform(45)).toBe('45m');
      expect(pipe.transform(1)).toBe('1m');
    });

    it('should convert 60 minutes to "1h"', () => {
      expect(pipe.transform(60)).toBe('1h');
    });

    it('should convert minutes to "Xh Ym" format when greater than 60', () => {
      expect(pipe.transform(90)).toBe('1h 30m');
      expect(pipe.transform(125)).toBe('2h 5m');
      expect(pipe.transform(195)).toBe('3h 15m');
    });

    it('should handle exact hour multiples', () => {
      expect(pipe.transform(120)).toBe('2h');
      expect(pipe.transform(180)).toBe('3h');
      expect(pipe.transform(240)).toBe('4h');
    });

    it('should handle zero minutes', () => {
      expect(pipe.transform(0)).toBe('0m');
    });

    it('should handle large values', () => {
      expect(pipe.transform(1440)).toBe('24h'); // 1 day
      expect(pipe.transform(1500)).toBe('25h'); // 25 hours
      expect(pipe.transform(2880)).toBe('48h'); // 2 days
    });

    it('should handle single-digit minutes with hours', () => {
      expect(pipe.transform(65)).toBe('1h 5m');
      expect(pipe.transform(122)).toBe('2h 2m');
    });
  });

  describe('edge cases', () => {
    it('should handle negative values gracefully', () => {
      // Depending on business logic, you might want to handle this differently
      const result = pipe.transform(-30);
      expect(result).toBeDefined();
    });

    it('should handle decimal values by rounding', () => {
      expect(pipe.transform(30.5)).toBe('30m');
      expect(pipe.transform(90.9)).toBe('1h 30m');
    });
  });

  describe('real-world examples (Lazy Habbit App)', () => {
    it('should format typical task durations', () => {
      expect(pipe.transform(30)).toBe('30m');  // Gym session
      expect(pipe.transform(60)).toBe('1h');   // Learning
      expect(pipe.transform(90)).toBe('1h 30m'); // Project work
      expect(pipe.transform(120)).toBe('2h');  // Deep work
    });

    it('should format weekly hours totals', () => {
      expect(pipe.transform(150)).toBe('2h 30m');  // 3x 30min tasks
      expect(pipe.transform(300)).toBe('5h');      // 5x 1hr tasks
      expect(pipe.transform(450)).toBe('7h 30m');  // Mixed tasks
    });
  });
});
