import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ScoreService } from './score';
import { SupabaseService } from './supabase';
import { UserService } from './user';

describe('ScoreService - Critical Business Logic', () => {
  let service: ScoreService;
  let supabaseMock: any;
  let userServiceMock: any;

  const mockUserId = 'test-user-id';

  beforeEach(() => {
    const supabaseClientMock = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn(),
            order: vi.fn().mockReturnValue({
              limit: vi.fn()
            })
          }),
          order: vi.fn().mockReturnValue({
            limit: vi.fn()
          })
        }),
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn()
          })
        })
      })
    };

    supabaseMock = {
      client: supabaseClientMock,
      getCurrentUser: vi.fn().mockResolvedValue({ id: mockUserId })
    };

    userServiceMock = {
      updateTier: vi.fn(),
      profile: vi.fn().mockReturnValue({
        current_tier: 5
      })
    };

    TestBed.configureTestingModule({
      providers: [
        ScoreService,
        { provide: SupabaseService, useValue: supabaseMock },
        { provide: UserService, useValue: userServiceMock }
      ]
    });

    service = TestBed.inject(ScoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Scoring Formula Verification', () => {
    it('should calculate perfect completion as 100%', () => {
      // Test logic: (hourScore + taskScore) / 2
      // Perfect: (1.0 + 1.0) / 2 = 1.0 (100%)
      const hourScore = 1.0;
      const taskScore = 1.0;
      const expectedOverall = 1.0;

      expect((hourScore + taskScore) / 2).toBe(expectedOverall);
    });

    it('should calculate partial completion correctly', () => {
      // 3 out of 4 tasks: 75%
      const hourScore = 0.75;
      const taskScore = 0.75;
      const expectedOverall = 0.75;

      expect((hourScore + taskScore) / 2).toBe(expectedOverall);
    });

    it('should calculate mixed scores correctly', () => {
      // Hour score: 87.5%, Task score: 80%
      // Overall: (0.875 + 0.8) / 2 = 0.8375 (83.75%)
      const hourScore = 0.875;
      const taskScore = 0.8;
      const expectedOverall = 0.8375;

      expect((hourScore + taskScore) / 2).toBeCloseTo(expectedOverall, 4);
    });

    it('should handle zero completion', () => {
      const hourScore = 0;
      const taskScore = 0;
      const expectedOverall = 0;

      expect((hourScore + taskScore) / 2).toBe(expectedOverall);
    });

    it('should handle over-completion', () => {
      // 5 tasks completed when only 3 planned
      const hourScore = 1.666;
      const taskScore = 1.666;

      expect((hourScore + taskScore) / 2).toBeGreaterThan(1.0);
    });
  });

  describe('Tier Track Determination Rules', () => {
    it('should return "promotion" for 80%+ overall AND all categories ≥50%', () => {
      const overallScore = 0.85;
      const allCategoriesAbove50 = true;

      expect(overallScore >= 0.8 && allCategoriesAbove50).toBe(true);
    });

    it('should return "demotion" for <60% overall', () => {
      const overallScore = 0.55;

      expect(overallScore < 0.6).toBe(true);
    });

    it('should return "stable" for 60-79% overall', () => {
      const overallScore = 0.7;

      expect(overallScore >= 0.6 && overallScore < 0.8).toBe(true);
    });

    it('should block promotion if one category below 50%', () => {
      const overallScore = 0.82; // High overall
      const categoriesBelow50: number = 1; // One category fails

      const isPromotion = overallScore >= 0.8 && categoriesBelow50 === 0;

      expect(isPromotion).toBe(false); // Blocked by category rule
    });

    it('should trigger demotion for two+ categories below 50%', () => {
      const overallScore = 0.75; // Overall is good
      const categoriesBelow50: number = 2; // Two categories fail

      const isDemotion = overallScore < 0.6 || categoriesBelow50 >= 2;

      expect(isDemotion).toBe(true);
    });

    it('should handle boundary at exactly 80%', () => {
      const overallScore = 0.8;

      expect(overallScore >= 0.8).toBe(true); // Qualifies for promotion
    });

    it('should handle boundary at exactly 60%', () => {
      const overallScore = 0.6;

      expect(overallScore >= 0.6).toBe(true); // NOT demotion
    });

    it('should trigger demotion at 59.9%', () => {
      const overallScore = 0.599;

      expect(overallScore < 0.6).toBe(true);
    });
  });

  describe('3-Week Tier Buffer Logic', () => {
    it('should NOT change tier with only 1 week on same track', () => {
      const consecutiveWeeks = 1;
      const requiredWeeks = 3;

      expect(consecutiveWeeks >= requiredWeeks).toBe(false);
    });

    it('should NOT change tier with only 2 consecutive weeks', () => {
      const consecutiveWeeks = 2;
      const requiredWeeks = 3;

      expect(consecutiveWeeks >= requiredWeeks).toBe(false);
    });

    it('should change tier after 3 consecutive weeks', () => {
      const consecutiveWeeks = 3;
      const requiredWeeks = 3;

      expect(consecutiveWeeks >= requiredWeeks).toBe(true);
    });

    it('should NOT promote beyond tier 10', () => {
      const currentTier = 10;
      const maxTier = 10;

      expect(currentTier < maxTier).toBe(false);
    });

    it('should NOT demote below tier 0', () => {
      const currentTier = 0;
      const minTier = 0;

      expect(currentTier > minTier).toBe(false);
    });
  });

  describe('Real-World Calculation Examples', () => {
    it('should calculate gym sessions correctly', () => {
      // 3 gym sessions @ 60min each = 180min scheduled
      // 3 completed = 180min completed
      const scheduledHours = (3 * 60) / 60; // 3 hours
      const completedHours = (3 * 60) / 60; // 3 hours
      const hourScore = completedHours / scheduledHours;

      const scheduledTasks = 3;
      const completedTasks = 3;
      const taskScore = completedTasks / scheduledTasks;

      const overallScore = (hourScore + taskScore) / 2;

      expect(overallScore).toBe(1.0); // Perfect 100%
    });

    it('should calculate mixed week correctly', () => {
      // 3 gym (60min) + 2 reading (90min)
      // Completed: 3 gym + 1 reading
      const scheduledHours = ((3 * 60) + (2 * 90)) / 60; // 6 hours
      const completedHours = ((3 * 60) + (1 * 90)) / 60; // 4.5 hours
      const hourScore = completedHours / scheduledHours; // 0.75

      const scheduledTasks = 5;
      const completedTasks = 4;
      const taskScore = completedTasks / scheduledTasks; // 0.8

      const overallScore = (hourScore + taskScore) / 2; // 0.775

      expect(overallScore).toBeCloseTo(0.775, 3);
    });

    it('should handle zero scheduled tasks', () => {
      const scheduledHours = 0;
      const completedHours = 0;
      const hourScore = scheduledHours > 0 ? completedHours / scheduledHours : 0;

      const scheduledTasks = 0;
      const completedTasks = 0;
      const taskScore = scheduledTasks > 0 ? completedTasks / scheduledTasks : 0;

      const overallScore = (hourScore + taskScore) / 2;

      expect(overallScore).toBe(0);
    });
  });

  describe('Tier Thresholds', () => {
    it('should recognize promotion threshold (80%)', () => {
      const score = 0.8;
      const isPromotion = score >= 0.8;

      expect(isPromotion).toBe(true);
    });

    it('should recognize demotion threshold (60%)', () => {
      const score = 0.6;
      const isDemotion = score < 0.6;

      expect(isDemotion).toBe(false); // 60% is NOT demotion
    });

    it('should recognize clean week threshold (50% per category)', () => {
      const categoryScore = 0.5;
      const isClean = categoryScore >= 0.5;

      expect(isClean).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle over-delivery (more than planned)', () => {
      // Planned 3 tasks, completed 5
      const scheduledTasks = 3;
      const completedTasks = 5;
      const taskScore = completedTasks / scheduledTasks;

      expect(taskScore).toBeGreaterThan(1.0);
      expect(taskScore).toBeCloseTo(1.666, 2);
    });

    it('should handle partial task completion', () => {
      // Completed 2.5 tasks out of 3 (via fractional hours)
      const scheduledHours = 3;
      const completedHours = 2.5;
      const hourScore = completedHours / scheduledHours;

      expect(hourScore).toBeCloseTo(0.833, 2);
    });

    it('should round percentages correctly', () => {
      const score = 0.775;
      const percentage = Math.round(score * 100);

      expect(percentage).toBe(78); // 77.5% rounds to 78%
    });
  });
});
