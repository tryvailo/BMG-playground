/**
 * Tests for Dashboard Exporter
 * Week 5: Export functionality tests
 */

import { describe, it, expect } from 'vitest';
import {
  exportServicesExcel,
  exportDashboardExcel,
  generateDashboardPDFContent,
  type DashboardExportData,
  type ServiceExportData,
  type TechAuditExportData,
} from '../dashboard-exporter';

describe('dashboard-exporter', () => {
  const mockServices: ServiceExportData[] = [
    {
      serviceName: 'Cardiology',
      targetPage: 'https://clinic.ua/cardiology',
      country: 'UA',
      city: 'Kyiv',
      visibility: 75,
      position: 2,
      aivScore: 68.5,
    },
    {
      serviceName: 'Dentistry',
      targetPage: 'https://clinic.ua/dentistry',
      country: 'UA',
      city: 'Kyiv',
      visibility: 0,
      position: undefined,
      aivScore: 32.1,
    },
  ];

  const mockTechAudit: TechAuditExportData = {
    desktopScore: 85,
    mobileScore: 72,
    httpsEnabled: true,
    mobileFriendly: true,
    llmsTxtPresent: true,
    llmsTxtScore: 80,
    robotsTxtPresent: true,
    sitemapPresent: true,
    schemas: [
      { name: 'MedicalOrganization', present: true },
      { name: 'Physician', present: true },
      { name: 'LocalBusiness', present: false },
    ],
  };

  const mockDashboardData: DashboardExportData = {
    clinicName: 'Test Clinic',
    generatedAt: '2026-01-06T12:00:00Z',
    clinicAIScore: 72,
    visibility: 65,
    techScore: 80,
    contentScore: 70,
    eeatScore: 75,
    localScore: 60,
    performanceScore: 85,
    services: mockServices,
    techAudit: mockTechAudit,
    competitors: [
      { name: 'Competitor 1', score: 78, position: 1 },
      { name: 'Competitor 2', score: 65, position: 3 },
    ],
  };

  describe('exportServicesExcel', () => {
    it('creates a valid Blob with correct MIME type', () => {
      const blob = exportServicesExcel(mockServices, 'Test Clinic');
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('handles empty services array', () => {
      const blob = exportServicesExcel([], 'Test Clinic');
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('exportDashboardExcel', () => {
    it('creates a valid Blob with correct MIME type', () => {
      const blob = exportDashboardExcel(mockDashboardData);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('handles data without tech audit', () => {
      const dataWithoutTechAudit: DashboardExportData = {
        ...mockDashboardData,
        techAudit: undefined,
      };
      
      const blob = exportDashboardExcel(dataWithoutTechAudit);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('handles data without competitors', () => {
      const dataWithoutCompetitors: DashboardExportData = {
        ...mockDashboardData,
        competitors: [],
      };
      
      const blob = exportDashboardExcel(dataWithoutCompetitors);
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('generateDashboardPDFContent', () => {
    it('generates valid HTML string', () => {
      const html = generateDashboardPDFContent(mockDashboardData);
      
      expect(typeof html).toBe('string');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
    });

    it('includes clinic name', () => {
      const html = generateDashboardPDFContent(mockDashboardData);
      
      expect(html).toContain('Test Clinic');
    });

    it('includes key metrics', () => {
      const html = generateDashboardPDFContent(mockDashboardData);
      
      expect(html).toContain('72'); // ClinicAI Score
      expect(html).toContain('65'); // Visibility
      expect(html).toContain('80'); // Tech Score
    });

    it('includes services data', () => {
      const html = generateDashboardPDFContent(mockDashboardData);
      
      expect(html).toContain('Cardiology');
      expect(html).toContain('Dentistry');
    });

    it('includes tech audit data when present', () => {
      const html = generateDashboardPDFContent(mockDashboardData);
      
      expect(html).toContain('85'); // Desktop Speed
      expect(html).toContain('72'); // Mobile Speed
      expect(html).toContain('MedicalOrganization');
    });

    it('handles data without tech audit', () => {
      const dataWithoutTechAudit: DashboardExportData = {
        ...mockDashboardData,
        techAudit: undefined,
      };
      
      const html = generateDashboardPDFContent(dataWithoutTechAudit);
      
      expect(html).toContain('Test Clinic');
      expect(html).not.toContain('Technical Audit');
    });

    it('escapes HTML special characters in clinic name', () => {
      const dataWithSpecialChars: DashboardExportData = {
        ...mockDashboardData,
        clinicName: 'Test <script>alert("xss")</script> Clinic',
      };
      
      const html = generateDashboardPDFContent(dataWithSpecialChars);
      
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('ServiceExportData interface', () => {
    it('accepts valid service data', () => {
      const service: ServiceExportData = {
        serviceName: 'Test Service',
        targetPage: 'https://example.com',
        visibility: 50,
        aivScore: 60,
      };

      expect(service.serviceName).toBe('Test Service');
    });
  });

  describe('DashboardExportData interface', () => {
    it('requires all mandatory fields', () => {
      const data: DashboardExportData = {
        clinicName: 'Test',
        generatedAt: '2026-01-01',
        clinicAIScore: 0,
        visibility: 0,
        techScore: 0,
        contentScore: 0,
        eeatScore: 0,
        localScore: 0,
        performanceScore: 0,
        services: [],
      };

      expect(data.clinicName).toBe('Test');
    });
  });
});
