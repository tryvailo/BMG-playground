/**
 * Integration Tests for Dashboard Server Action
 * 
 * Tests the integration of new metrics calculator with existing dashboard logic
 */

import {
  calculateClinicAIScore,
  type ClinicAIScoreComponents,
} from '~/lib/modules/dashboard/metrics-calculator';

describe('Dashboard Integration Tests', () => {
  describe('ClinicAI Score calculation with real weekly stats data', () => {
    it('should calculate score correctly with typical weekly stats', () => {
      // Typical weekly stats from DB
      const components: ClinicAIScoreComponents = {
        visibility: 75, // 75% of keywords visible
        techOptimization: 80, // Tech score from tech_audits
        contentOptimization: 70, // Content optimization score
        eeatSignals: 85, // E-E-A-T signals detected
        localSignals: 60, // Local SEO indicators
      };

      const result = calculateClinicAIScore(components);

      // Expected: 0.25*75 + 0.2*80 + 0.2*70 + 0.15*85 + 0.1*60
      // = 18.75 + 16 + 14 + 12.75 + 6 = 67.5
      expect(result.score).toBe(67.5);
      expect(result.components.visibility).toBe(75);
      expect(result.weights.visibility).toBe(0.25);
    });

    it('should handle perfect scores', () => {
      const components: ClinicAIScoreComponents = {
        visibility: 100,
        techOptimization: 100,
        contentOptimization: 100,
        eeatSignals: 100,
        localSignals: 100,
      };

      const result = calculateClinicAIScore(components);
      expect(result.score).toBe(100);
    });

    it('should handle zero scores', () => {
      const components: ClinicAIScoreComponents = {
        visibility: 0,
        techOptimization: 0,
        contentOptimization: 0,
        eeatSignals: 0,
        localSignals: 0,
      };

      const result = calculateClinicAIScore(components);
      expect(result.score).toBe(0);
    });

    it('should clamp values above 100', () => {
      const components: ClinicAIScoreComponents = {
        visibility: 150,
        techOptimization: 200,
        contentOptimization: 100,
        eeatSignals: 100,
        localSignals: 100,
      };

      const result = calculateClinicAIScore(components);
      // Should be clamped: 0.25*100 + 0.2*100 + ...
      expect(result.components.visibility).toBe(100);
      expect(result.components.techOptimization).toBe(100);
    });

    it('should handle mixed scores (typical clinic scenario)', () => {
      // Clinic with good visibility but poor technical SEO
      const components: ClinicAIScoreComponents = {
        visibility: 85, // Strong visibility
        techOptimization: 45, // Poor technical implementation
        contentOptimization: 60, // Average content
        eeatSignals: 50, // Weak expertise signals
        localSignals: 75, // Good local SEO
      };

      const result = calculateClinicAIScore(components);

      // 0.25*85 + 0.2*45 + 0.2*60 + 0.15*50 + 0.1*75
      // = 21.25 + 9 + 12 + 7.5 + 7.5 = 57.25
      expect(result.score).toBe(57.25);
    });
  });

  describe('Compatibility with dashboard API response structure', () => {
    it('should provide correct output format for API response', () => {
      const components: ClinicAIScoreComponents = {
        visibility: 72,
        techOptimization: 65,
        contentOptimization: 55,
        eeatSignals: 80,
        localSignals: 70,
      };

      const result = calculateClinicAIScore(components);

      // Should have structure expected by /api/dashboard
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('components');
      expect(result).toHaveProperty('weights');

      // Verify all component keys match database field names
      expect(result.components).toHaveProperty('visibility');
      expect(result.components).toHaveProperty('techOptimization');
      expect(result.components).toHaveProperty('contentOptimization');
      expect(result.components).toHaveProperty('eeatSignals');
      expect(result.components).toHaveProperty('localSignals');
    });
  });

  describe('Decimal precision for dashboard metrics', () => {
    it('should round to 2 decimal places', () => {
      const components: ClinicAIScoreComponents = {
        visibility: 77.777,
        techOptimization: 88.888,
        contentOptimization: 66.666,
        eeatSignals: 55.555,
        localSignals: 44.444,
      };

      const result = calculateClinicAIScore(components);

      // Check that score has max 2 decimal places
      const decimalPlaces = result.score.toString().split('.')[1]?.length || 0;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });

  describe('Real-world clinic data scenarios', () => {
    it('should score a clinic with excellent SEO', () => {
      const excellentClinic: ClinicAIScoreComponents = {
        visibility: 92,
        techOptimization: 88,
        contentOptimization: 85,
        eeatSignals: 90,
        localSignals: 87,
      };

      const result = calculateClinicAIScore(excellentClinic);

      // Should be high score (85+)
      expect(result.score).toBeGreaterThan(85);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should score a clinic with poor SEO', () => {
      const poorClinic: ClinicAIScoreComponents = {
        visibility: 20,
        techOptimization: 30,
        contentOptimization: 25,
        eeatSignals: 15,
        localSignals: 35,
      };

      const result = calculateClinicAIScore(poorClinic);

      // Should be low score (20-30)
      expect(result.score).toBeLessThan(35);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should score a clinic with inconsistent metrics', () => {
      // High visibility but poor optimization
      const inconsistentClinic: ClinicAIScoreComponents = {
        visibility: 95,
        techOptimization: 25,
        contentOptimization: 30,
        eeatSignals: 40,
        localSignals: 85,
      };

      const result = calculateClinicAIScore(inconsistentClinic);

      // Score should be moderate (weighted toward visibility and local)
      expect(result.score).toBeGreaterThan(40);
      expect(result.score).toBeLessThan(75);
    });
  });

  describe('Weight verification', () => {
    it('should return correct weights that sum to 1.0', () => {
      const components: ClinicAIScoreComponents = {
        visibility: 50,
        techOptimization: 50,
        contentOptimization: 50,
        eeatSignals: 50,
        localSignals: 50,
      };

      const result = calculateClinicAIScore(components);
      const weightSum =
        result.weights.visibility +
        result.weights.techOptimization +
        result.weights.contentOptimization +
        result.weights.eeatSignals +
        result.weights.localSignals;

      expect(weightSum).toBe(1.0);
    });

    it('should verify correct weight values', () => {
      const components: ClinicAIScoreComponents = {
        visibility: 50,
        techOptimization: 50,
        contentOptimization: 50,
        eeatSignals: 50,
        localSignals: 50,
      };

      const result = calculateClinicAIScore(components);

      expect(result.weights.visibility).toBe(0.25);
      expect(result.weights.techOptimization).toBe(0.2);
      expect(result.weights.contentOptimization).toBe(0.2);
      expect(result.weights.eeatSignals).toBe(0.15);
      expect(result.weights.localSignals).toBe(0.1);
    });
  });
});
