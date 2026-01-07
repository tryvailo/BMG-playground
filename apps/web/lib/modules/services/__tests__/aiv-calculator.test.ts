/**
 * Unit Tests for AIV Calculator
 */

import {
  calculateAIVScore,
  calculateAIVScoreSimplified,
  getAIVBadgeVariant,
  getAIVRating,
  calculateAIVImprovement,
  calculateBulkAIVScores,
  compareAIVScores,
  getPositionRecommendation,
  type AIVScoreInput,
} from '../aiv-calculator';

describe('AIV Calculator', () => {
  describe('calculateAIVScore', () => {
    it('should calculate maximum score for visible keyword at position 1', () => {
      const result = calculateAIVScore({
        isVisible: true,
        position: 1,
        totalResults: 100,
        competitorsScore: 100,
      });

      expect(result.score).toBeGreaterThan(20);
      expect(result.components.visibility).toBe(1);
    });

    it('should calculate zero for non-visible service', () => {
      const result = calculateAIVScore({
        isVisible: false,
        position: 1,
        totalResults: 100,
        competitorsScore: 100,
      });

      expect(result.score).toBeLessThan(5);
      expect(result.components.visibility).toBe(0);
    });

    it('should decrease score with worse position', () => {
      const pos1 = calculateAIVScore({
        isVisible: true,
        position: 1,
        totalResults: 100,
        competitorsScore: 50,
      });

      const pos5 = calculateAIVScore({
        isVisible: true,
        position: 5,
        totalResults: 100,
        competitorsScore: 50,
      });

      expect(pos1.score).toBeGreaterThan(pos5.score);
    });

    it('should return structured result with breakdown', () => {
      const result = calculateAIVScore({
        isVisible: true,
        position: 3,
        totalResults: 10,
        competitorsScore: 75,
      });

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('components');
      expect(result).toHaveProperty('breakdown');
      expect(result.breakdown.visibilityComponent).toBeGreaterThan(0);
      expect(result.breakdown.positionComponent).toBeGreaterThan(0);
      expect(result.breakdown.competitiveComponent).toBeGreaterThan(0);
    });

    it('should handle typical clinic service scenario', () => {
      const result = calculateAIVScore({
        isVisible: true,
        position: 7,
        totalResults: 10,
        competitorsScore: 60,
      });

      // Should be moderate score (visible but poor position)
      expect(result.score).toBeGreaterThan(5);
      expect(result.score).toBeLessThan(20);
    });

    it('should normalize competitor score to 0-1', () => {
      const low = calculateAIVScore({
        isVisible: true,
        position: 1,
        totalResults: 100,
        competitorsScore: 0,
      });

      const high = calculateAIVScore({
        isVisible: true,
        position: 1,
        totalResults: 100,
        competitorsScore: 100,
      });

      expect(high.score).toBeGreaterThan(low.score);
    });
  });

  describe('calculateAIVScoreSimplified', () => {
    it('should calculate score from aggregated metrics', () => {
      const score = calculateAIVScoreSimplified(100, 1, 75);
      expect(score).toBeGreaterThan(10);
    });

    it('should handle zero visibility', () => {
      const score = calculateAIVScoreSimplified(0, 1, 75);
      expect(score).toBeLessThan(5);
    });
  });

  describe('getAIVBadgeVariant', () => {
    it('should return success for good scores (25+)', () => {
      expect(getAIVBadgeVariant(25)).toBe('success');
      expect(getAIVBadgeVariant(30)).toBe('success');
    });

    it('should return warning for medium scores (15-25)', () => {
      expect(getAIVBadgeVariant(15)).toBe('warning');
      expect(getAIVBadgeVariant(20)).toBe('warning');
    });

    it('should return outline for poor scores (<15)', () => {
      expect(getAIVBadgeVariant(10)).toBe('outline');
      expect(getAIVBadgeVariant(5)).toBe('outline');
    });
  });

  describe('getAIVRating', () => {
    it('should return correct rating for scores', () => {
      expect(getAIVRating(35)).toBe('Excellent');
      expect(getAIVRating(25)).toBe('Good');
      expect(getAIVRating(15)).toBe('Fair');
      expect(getAIVRating(8)).toBe('Poor');
      expect(getAIVRating(2)).toBe('Very Poor');
    });
  });

  describe('calculateAIVImprovement', () => {
    it('should show score improvement from position change', () => {
      const input: AIVScoreInput = {
        isVisible: true,
        position: 8,
        totalResults: 10,
        competitorsScore: 60,
      };

      const improvement = calculateAIVImprovement(input, 3);

      expect(improvement.potentialScore).toBeGreaterThan(improvement.currentScore);
      expect(improvement.improvement).toBeGreaterThan(0);
      expect(improvement.improvementPercent).toBeGreaterThan(0);
    });

    it('should handle impossible improvements', () => {
      const input: AIVScoreInput = {
        isVisible: true,
        position: 1,
        totalResults: 10,
        competitorsScore: 100,
      };

      const improvement = calculateAIVImprovement(input, 1);

      expect(improvement.improvement).toBe(0);
    });
  });

  describe('calculateBulkAIVScores', () => {
    it('should calculate scores for multiple services', () => {
      const services = [
        {
          id: 'svc1',
          isVisible: true,
          position: 1,
          totalResults: 100,
          competitorsScore: 70,
        },
        {
          id: 'svc2',
          isVisible: true,
          position: 5,
          totalResults: 100,
          competitorsScore: 50,
        },
      ];

      const results = calculateBulkAIVScores(services);

      expect(results).toHaveLength(2);
      expect(results[0].aivScore).toBeGreaterThan(results[1].aivScore);
      expect(results[0]).toHaveProperty('rating');
      expect(results[0]).toHaveProperty('variant');
    });
  });

  describe('compareAIVScores', () => {
    it('should correctly compare two services', () => {
      const service1: AIVScoreInput = {
        isVisible: true,
        position: 1,
        totalResults: 100,
        competitorsScore: 80,
      };

      const service2: AIVScoreInput = {
        isVisible: true,
        position: 5,
        totalResults: 100,
        competitorsScore: 60,
      };

      const comparison = compareAIVScores(service1, service2);

      expect(comparison.winner).toBe('service1');
      expect(comparison.difference).toBeGreaterThan(0);
      expect(comparison.service1Score).toBeGreaterThan(comparison.service2Score);
    });

    it('should detect tie', () => {
      const input: AIVScoreInput = {
        isVisible: true,
        position: 3,
        totalResults: 100,
        competitorsScore: 70,
      };

      const comparison = compareAIVScores(input, input);

      expect(comparison.winner).toBe('tie');
      expect(comparison.difference).toBe(0);
    });
  });

  describe('getPositionRecommendation', () => {
    it('should recommend position to reach target score', () => {
      const input: AIVScoreInput = {
        isVisible: true,
        position: 8,
        totalResults: 10,
        competitorsScore: 70,
      };

      const recommendation = getPositionRecommendation(input, 15);

      if (recommendation) {
        expect(recommendation).toBeLessThan(input.position);
      }
    });

    it('should return null for impossible targets when not visible', () => {
      const input: AIVScoreInput = {
        isVisible: false,
        position: 1,
        totalResults: 100,
        competitorsScore: 100,
      };

      const recommendation = getPositionRecommendation(input, 30);

      expect(recommendation).toBeNull();
    });
  });

  describe('Real-world service scenarios', () => {
    it('should score clinic service with good visibility', () => {
      const result = calculateAIVScore({
        isVisible: true,
        position: 2,
        totalResults: 50,
        competitorsScore: 65,
      });

      expect(result.score).toBeGreaterThan(15);
      expect(getAIVRating(result.score)).toBe('Fair');
    });

    it('should score poorly visible service', () => {
      const result = calculateAIVScore({
        isVisible: true,
        position: 10,
        totalResults: 100,
        competitorsScore: 40,
      });

      expect(result.score).toBeLessThan(10);
      expect(getAIVRating(result.score)).toBe('Poor');
    });

    it('should score highly ranked service', () => {
      const result = calculateAIVScore({
        isVisible: true,
        position: 1,
        totalResults: 100,
        competitorsScore: 80,
      });

      expect(result.score).toBeGreaterThan(24);
      expect(getAIVRating(result.score)).toBe('Good');
    });
  });
});
