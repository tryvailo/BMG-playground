/**
 * Tests for PageSpeed Integration
 * Unit tests for Google PageSpeed Insights API
 */

import {
  getPageSpeedBadgeVariant,
  getPageSpeedRating,
  getMetricRating,
  formatMetric,
  calculatePageSpeedImprovement,
  getMockPageSpeedScore,
} from '../pagespeed-integration';
import { PageSpeedAnalysis } from '../pagespeed-integration';

describe('PageSpeed Integration', () => {
  describe('getPageSpeedScore', () => {
    it('should return mock score when API key is missing', async () => {
      const result = getMockPageSpeedScore('https://example.com');
      expect(result).toHaveProperty('desktopScore');
      expect(result).toHaveProperty('mobileScore');
      expect(result.desktopScore).toBeGreaterThanOrEqual(60);
      expect(result.desktopScore).toBeLessThanOrEqual(100);
    });

    it('should generate desktop and mobile scores', () => {
      const result = getMockPageSpeedScore('https://example.com');
      expect(result.desktopScore).toBeGreaterThanOrEqual(60);
      expect(result.mobileScore).toBeGreaterThanOrEqual(40);
      expect(result.mobileScore).toBeLessThanOrEqual(result.desktopScore + 10);
    });
  });

  describe('getPageSpeedBadgeVariant', () => {
    it('should return success for score >= 90', () => {
      expect(getPageSpeedBadgeVariant(95)).toBe('success');
      expect(getPageSpeedBadgeVariant(90)).toBe('success');
    });

    it('should return warning for score >= 50', () => {
      expect(getPageSpeedBadgeVariant(85)).toBe('warning');
      expect(getPageSpeedBadgeVariant(50)).toBe('warning');
    });

    it('should return destructive for score < 50', () => {
      expect(getPageSpeedBadgeVariant(45)).toBe('destructive');
      expect(getPageSpeedBadgeVariant(0)).toBe('destructive');
    });
  });

  describe('getPageSpeedRating', () => {
    it('should return Excellent for high scores', () => {
      expect(getPageSpeedRating(95)).toBe('Excellent');
      expect(getPageSpeedRating(90)).toBe('Excellent');
    });

    it('should return Needs Improvement for medium scores', () => {
      expect(getPageSpeedRating(75)).toBe('Needs Improvement');
      expect(getPageSpeedRating(50)).toBe('Needs Improvement');
    });

    it('should return Poor for low scores', () => {
      expect(getPageSpeedRating(45)).toBe('Poor');
      expect(getPageSpeedRating(0)).toBe('Poor');
    });
  });

  describe('getMetricRating', () => {
    describe('LCP (Largest Contentful Paint)', () => {
      it('should rate good LCP', () => {
        expect(getMetricRating('lcp', 2000)).toBe('good');
        expect(getMetricRating('lcp', 2500)).toBe('good');
      });

      it('should rate needs-improvement LCP', () => {
        expect(getMetricRating('lcp', 3000)).toBe('needs-improvement');
        expect(getMetricRating('lcp', 4000)).toBe('needs-improvement');
      });

      it('should rate poor LCP', () => {
        expect(getMetricRating('lcp', 5000)).toBe('poor');
      });
    });

    describe('FCP (First Contentful Paint)', () => {
      it('should rate good FCP', () => {
        expect(getMetricRating('fcp', 1500)).toBe('good');
        expect(getMetricRating('fcp', 1800)).toBe('good');
      });

      it('should rate needs-improvement FCP', () => {
        expect(getMetricRating('fcp', 2000)).toBe('needs-improvement');
        expect(getMetricRating('fcp', 3000)).toBe('needs-improvement');
      });

      it('should rate poor FCP', () => {
        expect(getMetricRating('fcp', 4000)).toBe('poor');
      });
    });

    describe('CLS (Cumulative Layout Shift)', () => {
      it('should rate good CLS', () => {
        expect(getMetricRating('cls', 0.05)).toBe('good');
        expect(getMetricRating('cls', 0.1)).toBe('good');
      });

      it('should rate needs-improvement CLS', () => {
        expect(getMetricRating('cls', 0.15)).toBe('needs-improvement');
        expect(getMetricRating('cls', 0.25)).toBe('needs-improvement');
      });

      it('should rate poor CLS', () => {
        expect(getMetricRating('cls', 0.3)).toBe('poor');
      });
    });

    describe('FID (First Input Delay)', () => {
      it('should rate good FID', () => {
        expect(getMetricRating('fid', 50)).toBe('good');
        expect(getMetricRating('fid', 100)).toBe('good');
      });

      it('should rate needs-improvement FID', () => {
        expect(getMetricRating('fid', 150)).toBe('needs-improvement');
        expect(getMetricRating('fid', 300)).toBe('needs-improvement');
      });

      it('should rate poor FID', () => {
        expect(getMetricRating('fid', 400)).toBe('poor');
      });
    });

    describe('TTFB (Time to First Byte)', () => {
      it('should rate good TTFB', () => {
        expect(getMetricRating('ttfb', 300)).toBe('good');
        expect(getMetricRating('ttfb', 600)).toBe('good');
      });

      it('should rate needs-improvement TTFB', () => {
        expect(getMetricRating('ttfb', 1000)).toBe('needs-improvement');
        expect(getMetricRating('ttfb', 1800)).toBe('needs-improvement');
      });

      it('should rate poor TTFB', () => {
        expect(getMetricRating('ttfb', 2000)).toBe('poor');
      });
    });
  });

  describe('formatMetric', () => {
    it('should format time metrics with ms suffix', () => {
      expect(formatMetric('lcp', 2345)).toBe('2345ms');
      expect(formatMetric('fcp', 1234)).toBe('1234ms');
    });

    it('should format CLS with 3 decimal places', () => {
      expect(formatMetric('cls', 0.123456)).toBe('0.123');
      expect(formatMetric('cls', 0.1)).toBe('0.100');
    });
  });

  describe('calculatePageSpeedImprovement', () => {
    it('should calculate improvement from current to target', () => {
      const analysis: PageSpeedAnalysis = {
        url: 'https://example.com',
        desktopScore: 80,
        mobileScore: 70,
        avgScore: 75,
        desktopMetrics: {
          lcp: 2500,
          fcp: 1800,
          cls: 0.1,
          fid: 100,
          ttfb: 600,
          tti: 3800,
        },
        mobileMetrics: {
          lcp: 3000,
          fcp: 2500,
          cls: 0.15,
          fid: 150,
          ttfb: 800,
          tti: 4500,
        },
        passed: true,
        timestamp: new Date(),
      };

      const improvement = calculatePageSpeedImprovement(analysis, 90);
      expect(improvement).toBeGreaterThan(0);
      expect(improvement).toBeLessThanOrEqual(100);
    });

    it('should return 0 when already at target', () => {
      const analysis: PageSpeedAnalysis = {
        url: 'https://example.com',
        desktopScore: 95,
        mobileScore: 90,
        avgScore: 92.5,
        desktopMetrics: {
          lcp: 1000,
          fcp: 500,
          cls: 0.05,
          fid: 50,
          ttfb: 300,
          tti: 2000,
        },
        mobileMetrics: {
          lcp: 1500,
          fcp: 800,
          cls: 0.08,
          fid: 80,
          ttfb: 400,
          tti: 2500,
        },
        passed: true,
        timestamp: new Date(),
      };

      const improvement = calculatePageSpeedImprovement(analysis, 90);
      expect(improvement).toBe(0);
    });
  });

  describe('Mock PageSpeed Data', () => {
    it('should generate consistent URL in mock data', () => {
      const url = 'https://example.com';
      const result = getMockPageSpeedScore(url);
      expect(result.url).toBe(url);
    });

    it('should have all required metrics in mock data', () => {
      const result = getMockPageSpeedScore('https://example.com');
      expect(result.desktopMetrics).toHaveProperty('lcp');
      expect(result.desktopMetrics).toHaveProperty('fcp');
      expect(result.desktopMetrics).toHaveProperty('cls');
      expect(result.desktopMetrics).toHaveProperty('fid');
      expect(result.desktopMetrics).toHaveProperty('ttfb');
      expect(result.desktopMetrics).toHaveProperty('tti');
    });

    it('should generate realistic metric values', () => {
      const result = getMockPageSpeedScore('https://example.com');
      expect(result.desktopMetrics.lcp).toBeGreaterThan(500);
      expect(result.desktopMetrics.lcp).toBeLessThan(3000);
      expect(result.desktopMetrics.cls).toBeGreaterThanOrEqual(0);
      expect(result.desktopMetrics.cls).toBeLessThan(1);
    });
  });
});
