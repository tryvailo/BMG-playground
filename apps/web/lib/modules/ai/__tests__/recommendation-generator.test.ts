/**
 * Tests for AI Recommendation Generator
 * Week 5: AI-powered recommendations
 */

import { describe, it, expect } from 'vitest';
import {
  getPriorityColor,
  getPriorityBadgeVariant,
  getCategoryIcon,
  type Recommendation,
  type ServiceForRecommendation,
  type TechAuditForRecommendation,
} from '../recommendation-generator';

describe('recommendation-generator', () => {
  describe('getPriorityColor', () => {
    it('returns red for high priority', () => {
      expect(getPriorityColor('high')).toBe('text-red-600');
    });

    it('returns amber for medium priority', () => {
      expect(getPriorityColor('medium')).toBe('text-amber-600');
    });

    it('returns blue for low priority', () => {
      expect(getPriorityColor('low')).toBe('text-blue-600');
    });
  });

  describe('getPriorityBadgeVariant', () => {
    it('returns destructive for high priority', () => {
      expect(getPriorityBadgeVariant('high')).toBe('destructive');
    });

    it('returns warning for medium priority', () => {
      expect(getPriorityBadgeVariant('medium')).toBe('warning');
    });

    it('returns secondary for low priority', () => {
      expect(getPriorityBadgeVariant('low')).toBe('secondary');
    });
  });

  describe('getCategoryIcon', () => {
    it('returns Eye for visibility', () => {
      expect(getCategoryIcon('visibility')).toBe('Eye');
    });

    it('returns Settings for technical', () => {
      expect(getCategoryIcon('technical')).toBe('Settings');
    });

    it('returns FileText for content', () => {
      expect(getCategoryIcon('content')).toBe('FileText');
    });

    it('returns Code for schema', () => {
      expect(getCategoryIcon('schema')).toBe('Code');
    });

    it('returns MapPin for local', () => {
      expect(getCategoryIcon('local')).toBe('MapPin');
    });

    it('returns Zap for performance', () => {
      expect(getCategoryIcon('performance')).toBe('Zap');
    });
  });

  describe('ServiceForRecommendation interface', () => {
    it('accepts valid service data', () => {
      const service: ServiceForRecommendation = {
        serviceName: 'Cardiology',
        targetPage: 'https://clinic.ua/cardiology',
        city: 'Kyiv',
        country: 'UA',
        visibility_score: 75,
        position: 2,
        aiv_score: 68,
        pagespeed_score: 85,
      };

      expect(service.serviceName).toBe('Cardiology');
      expect(service.visibility_score).toBe(75);
    });

    it('accepts minimal service data', () => {
      const service: ServiceForRecommendation = {
        serviceName: 'Dentist',
        targetPage: 'https://clinic.ua/dentist',
      };

      expect(service.serviceName).toBe('Dentist');
      expect(service.visibility_score).toBeUndefined();
    });
  });

  describe('TechAuditForRecommendation interface', () => {
    it('accepts valid tech audit data', () => {
      const audit: TechAuditForRecommendation = {
        desktop_speed_score: 85,
        mobile_speed_score: 72,
        https_enabled: true,
        mobile_friendly: true,
        llms_txt_present: true,
        llms_txt_score: 80,
        robots_txt_present: true,
        sitemap_present: true,
        schema_summary: {
          hasMedicalOrganization: true,
          hasPhysician: true,
          hasMedicalProcedure: false,
          hasLocalBusiness: true,
          hasFAQPage: false,
        },
      };

      expect(audit.desktop_speed_score).toBe(85);
      expect(audit.schema_summary?.hasMedicalOrganization).toBe(true);
    });
  });

  describe('Recommendation interface', () => {
    it('accepts valid recommendation', () => {
      const rec: Recommendation = {
        id: 'rec_1',
        category: 'technical',
        priority: 'high',
        title: 'Improve Page Speed',
        description: 'Your page speed is below optimal.',
        impact: 'High impact on visibility',
        effort: 'medium',
        steps: ['Step 1', 'Step 2'],
      };

      expect(rec.id).toBe('rec_1');
      expect(rec.priority).toBe('high');
      expect(rec.steps).toHaveLength(2);
    });
  });
});
