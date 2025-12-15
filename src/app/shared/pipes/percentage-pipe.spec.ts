import { describe, it, expect, beforeEach } from 'vitest';
import { PercentagePipe } from './percentage-pipe';

describe('PercentagePipe', () => {
  let pipe: PercentagePipe;

  beforeEach(() => {
    pipe = new PercentagePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('transform', () => {
    it('should convert decimal to percentage with default decimals (0)', () => {
      expect(pipe.transform(0.75)).toBe('75%');
      expect(pipe.transform(0.5)).toBe('50%');
      expect(pipe.transform(1.0)).toBe('100%');
    });

    it('should convert decimal to percentage with specified decimals', () => {
      expect(pipe.transform(0.756, 1)).toBe('75.6%');
      expect(pipe.transform(0.756, 2)).toBe('75.60%');
      expect(pipe.transform(0.333, 2)).toBe('33.30%');
    });

    it('should handle zero', () => {
      expect(pipe.transform(0)).toBe('0%');
      expect(pipe.transform(0, 1)).toBe('0.0%');
    });

    it('should handle 1.0 as 100%', () => {
      expect(pipe.transform(1.0)).toBe('100%');
      expect(pipe.transform(1.0, 1)).toBe('100.0%');
    });

    it('should round correctly', () => {
      expect(pipe.transform(0.855)).toBe('86%'); // Rounds up
      expect(pipe.transform(0.854)).toBe('85%'); // Rounds down
      expect(pipe.transform(0.8549, 1)).toBe('85.5%');
    });

    it('should handle values greater than 1', () => {
      expect(pipe.transform(1.5)).toBe('150%');
      expect(pipe.transform(2.0)).toBe('200%');
    });

    it('should handle very small values', () => {
      expect(pipe.transform(0.001)).toBe('0%');
      expect(pipe.transform(0.001, 1)).toBe('0.1%');
      expect(pipe.transform(0.001, 2)).toBe('0.10%');
    });
  });

  describe('edge cases', () => {
    it('should handle negative values', () => {
      expect(pipe.transform(-0.5)).toBe('-50%');
    });

    it('should default to 0 decimals when not specified', () => {
      const result = pipe.transform(0.755);
      expect(result).toBe('76%'); // Rounded
    });

    it('should handle maximum decimal places', () => {
      expect(pipe.transform(0.123456, 3)).toBe('12.346%');
    });
  });

  describe('real-world examples (Lazy Habbit App scoring)', () => {
    it('should format tier promotion threshold (80%)', () => {
      expect(pipe.transform(0.8)).toBe('80%');
      expect(pipe.transform(0.8, 1)).toBe('80.0%');
    });

    it('should format tier demotion threshold (60%)', () => {
      expect(pipe.transform(0.6)).toBe('60%');
    });

    it('should format category clean week threshold (50%)', () => {
      expect(pipe.transform(0.5)).toBe('50%');
    });

    it('should format typical weekly scores', () => {
      expect(pipe.transform(0.75)).toBe('75%');  // Good week
      expect(pipe.transform(0.92)).toBe('92%');  // Excellent week
      expect(pipe.transform(0.45)).toBe('45%');  // Below target
      expect(pipe.transform(0.33)).toBe('33%');  // Demotion week
    });

    it('should format category scores with precision', () => {
      expect(pipe.transform(0.667, 1)).toBe('66.7%'); // 2/3 tasks
      expect(pipe.transform(0.833, 1)).toBe('83.3%'); // 5/6 tasks
    });

    it('should handle perfect completion', () => {
      expect(pipe.transform(1.0)).toBe('100%');
    });

    it('should handle zero completion', () => {
      expect(pipe.transform(0.0)).toBe('0%');
    });
  });

  describe('scoring formula examples', () => {
    it('should format hour score', () => {
      const hourScore = 0.75; // 7.5 hours completed / 10 hours scheduled
      expect(pipe.transform(hourScore)).toBe('75%');
    });

    it('should format task score', () => {
      const taskScore = 0.8; // 4 tasks completed / 5 tasks scheduled
      expect(pipe.transform(taskScore)).toBe('80%');
    });

    it('should format overall score', () => {
      const hourScore = 0.75;
      const taskScore = 0.8;
      const overallScore = (hourScore + taskScore) / 2; // 0.775
      expect(pipe.transform(overallScore)).toBe('78%');
      expect(pipe.transform(overallScore, 1)).toBe('77.5%');
    });
  });
});
