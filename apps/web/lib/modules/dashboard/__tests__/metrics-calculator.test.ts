/**
 * Unit Tests for Metrics Calculator
 */

import {
  calculateClinicAIScore,
  calculateAIVScore,
  calculatePositionScore,
  calculateVisibilityScore,
  getScoreBadgeVariant,
  calculateTrend,
  formatScore,
} from '../metrics-calculator';

describe('Metrics Calculator', () => {
  describe('calculateClinicAIScore', () => {
    it('should correctly calculate formula with all equal scores', () => {
      const result = calculateClinicAIScore({
        visibility: 80,
        techOptimization: 80,
        contentOptimization: 80,
        eeatSignals: 80,
        localSignals: 80,
      });

      // All scores are 80, so result should be 80
      expect(result.score).toBe(80);
    });

    it('should correctly calculate with different component scores', () => {
      const result = calculateClinicAIScore({
        visibility: 75,
        techOptimization: 80,
        contentOptimization: 70,
        eeatSignals: 85,
        localSignals: 60,
      });

      // 75×0.25 + 80×0.2 + 70×0.2 + 85×0.15 + 60×0.1
      // = 18.75 + 16 + 14 + 12.75 + 6 = 67.5
      expect(result.score).toBe(67.5);
    });

    it('should normalize scores above 100', () => {
      const result = calculateClinicAIScore({
        visibility: 150, // Should be clamped to 100
        techOptimization: 80,
        contentOptimization: 70,
        eeatSignals: 85,
        localSignals: 60,
      });

      expect(result.components.visibility).toBe(100);
    });

    it('should handle zero scores', () => {
      const result = calculateClinicAIScore({
        visibility: 0,
        techOptimization: 0,
        contentOptimization: 0,
        eeatSignals: 0,
        localSignals: 0,
      });

      expect(result.score).toBe(0);
    });

    it('should return correct weight structure', () => {
      const result = calculateClinicAIScore({
        visibility: 50,
        techOptimization: 50,
        contentOptimization: 50,
        eeatSignals: 50,
        localSignals: 50,
      });

      expect(result.weights).toEqual({
        visibility: 0.25,
        techOptimization: 0.2,
        contentOptimization: 0.2,
        eeatSignals: 0.15,
        localSignals: 0.1,
      });
    });
  });

  describe('calculateAIVScore', () => {
    it('should return max score for visible keyword at position 1', () => {
      const score = calculateAIVScore({
        isVisible: true,
        position: 1,
        totalResults: 100,
        competitorsScore: 100,
      });

      expect(score).toBeGreaterThan(70);
    });

    it('should return 0 for not visible', () => {
      const score = calculateAIVScore({
        isVisible: false,
        position: 1,
        totalResults: 100,
        competitorsScore: 100,
      });

      expect(score).toBeLessThan(1);
    });

    it('should decrease score with worse position', () => {
      const score1 = calculateAIVScore({
        isVisible: true,
        position: 1,
        totalResults: 100,
        competitorsScore: 50,
      });

      const score10 = calculateAIVScore({
        isVisible: true,
        position: 10,
        totalResults: 100,
        competitorsScore: 50,
      });

      expect(score1).toBeGreaterThan(score10);
    });

    it('should return consistent score for same inputs', () => {
      const input = {
        isVisible: true,
        position: 5,
        totalResults: 100,
        competitorsScore: 75,
      };

      const score1 = calculateAIVScore(input);
      const score2 = calculateAIVScore(input);

      expect(score1).toBe(score2);
    });
  });

  describe('calculatePositionScore', () => {
    it('should return 100 for position 1', () => {
      expect(calculatePositionScore(1)).toBe(100);
    });

    it('should return 0 for position 10 or worse', () => {
      expect(calculatePositionScore(10)).toBe(0);
      expect(calculatePositionScore(11)).toBe(0);
    });

    it('should linearly interpolate between 1 and 10', () => {
      expect(calculatePositionScore(5)).toBe(55.56);
    });

    it('should return 0 for invalid position', () => {
      expect(calculatePositionScore(-1)).toBe(0);
      expect(calculatePositionScore(0)).toBe(0);
    });
  });

  describe('calculateVisibilityScore', () => {
    it('should return 100 when all keywords visible', () => {
      expect(calculateVisibilityScore(10, 10)).toBe(100);
    });

    it('should return 0 when no keywords visible', () => {
      expect(calculateVisibilityScore(0, 10)).toBe(0);
    });

    it('should return 50 for half visible', () => {
      expect(calculateVisibilityScore(5, 10)).toBe(50);
    });

    it('should handle zero total', () => {
      expect(calculateVisibilityScore(0, 0)).toBe(0);
    });
  });

  describe('getScoreBadgeVariant', () => {
    it('should return success for high scores', () => {
      expect(getScoreBadgeVariant(70)).toBe('success');
      expect(getScoreBadgeVariant(100)).toBe('success');
    });

    it('should return warning for medium scores', () => {
      expect(getScoreBadgeVariant(50)).toBe('warning');
      expect(getScoreBadgeVariant(40)).toBe('warning');
    });

    it('should return outline for low scores', () => {
      expect(getScoreBadgeVariant(30)).toBe('outline');
      expect(getScoreBadgeVariant(0)).toBe('outline');
    });
  });

  describe('calculateTrend', () => {
    it('should detect upward trend', () => {
      const trend = calculateTrend(100, 90);
      expect(trend.arrow).toBe('up');
      expect(trend.change).toBeGreaterThan(0);
    });

    it('should detect downward trend', () => {
      const trend = calculateTrend(90, 100);
      expect(trend.arrow).toBe('down');
      expect(trend.change).toBeLessThan(0);
    });

    it('should detect stable trend', () => {
      const trend = calculateTrend(100, 100);
      expect(trend.arrow).toBe('stable');
    });

    it('should invert colors for inverse metrics', () => {
      // For position (lower is better), up is bad
      const upTrend = calculateTrend(5, 4, true); // Position went from 4 to 5
      expect(upTrend.color).toBe('danger');

      const downTrend = calculateTrend(3, 4, true); // Position went from 4 to 3
      expect(downTrend.color).toBe('success');
    });
  });

  describe('formatScore', () => {
    it('should format with default decimals', () => {
      expect(formatScore(75.55)).toBe('75.6');
    });

    it('should format with specified decimals', () => {
      expect(formatScore(75.555, 2)).toBe('75.56');
      expect(formatScore(75.555, 0)).toBe('76');
    });
  });
});
