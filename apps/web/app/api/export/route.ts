/**
 * Export API
 * Week 5, Days 2-3: Export dashboard and services data
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  exportServicesExcel,
  exportDashboardExcel,
  generateDashboardPDFContent,
  type DashboardExportData,
  type ServiceExportData,
  type TechAuditExportData,
} from '~/lib/modules/export/dashboard-exporter';
import { getServicesByProjectId } from '~/lib/modules/services/service-repository';
import { getTechAuditByProjectId } from '~/lib/modules/audit/tech-audit-service';
import { getDashboardData } from '~/lib/modules/dashboard/clinic-service';

/**
 * GET /api/export
 * Export data in specified format
 * 
 * Query params:
 * - projectId: string (required)
 * - format: 'excel' | 'pdf' | 'json' (default: 'excel')
 * - type: 'services' | 'dashboard' | 'full' (default: 'full')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const format = searchParams.get('format') || 'excel';
    const type = searchParams.get('type') || 'full';

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 },
      );
    }

    // Fetch data
    const services = await getServicesByProjectId(projectId);
    const techAudit = await getTechAuditByProjectId(projectId);
    const dashboardData = await getDashboardData(projectId);

    // Transform services
    const servicesData: ServiceExportData[] = services.map((s) => ({
      serviceName: s.service_name,
      targetPage: s.target_page,
      country: s.country,
      city: s.city,
      visibility: s.visibility_score || 0,
      position: s.position,
      aivScore: s.aiv_score || 0,
    }));

    // Transform tech audit
    const techAuditData: TechAuditExportData | undefined = techAudit
      ? {
          desktopScore: techAudit.desktop_speed_score || 0,
          mobileScore: techAudit.mobile_speed_score || 0,
          httpsEnabled: techAudit.https_enabled || false,
          mobileFriendly: techAudit.mobile_friendly || false,
          llmsTxtPresent: techAudit.llms_txt_present || false,
          llmsTxtScore: techAudit.llms_txt_score ?? undefined,
          robotsTxtPresent: techAudit.robots_txt_present || false,
          sitemapPresent: techAudit.sitemap_present || false,
          schemas: [
            { name: 'MedicalOrganization', present: Boolean(techAudit.schema_summary?.hasMedicalOrganization) },
            { name: 'Physician', present: Boolean(techAudit.schema_summary?.hasPhysician) },
            { name: 'MedicalProcedure', present: Boolean(techAudit.schema_summary?.hasMedicalProcedure) },
            { name: 'LocalBusiness', present: Boolean(techAudit.schema_summary?.hasLocalBusiness) },
            { name: 'FAQPage', present: Boolean(techAudit.schema_summary?.hasFAQPage) },
            { name: 'MedicalSpecialty', present: Boolean(techAudit.schema_summary?.hasMedicalSpecialty) },
            { name: 'Review', present: Boolean(techAudit.schema_summary?.hasReview) },
            { name: 'BreadcrumbList', present: Boolean(techAudit.schema_summary?.hasBreadcrumbList) },
          ],
        }
      : undefined;

    // Prepare full dashboard data
    const fullData: DashboardExportData = {
      clinicName: dashboardData?.clinicName || 'Medical Clinic',
      generatedAt: new Date().toISOString(),
      clinicAIScore: dashboardData?.clinicAIScore || 0,
      visibility: dashboardData?.visibility || 0,
      techScore: dashboardData?.techScore || 0,
      contentScore: dashboardData?.contentScore || 0,
      eeatScore: dashboardData?.eeatScore || 0,
      localScore: dashboardData?.localScore || 0,
      performanceScore: dashboardData?.performanceScore || 0,
      services: servicesData,
      techAudit: techAuditData,
      competitors: dashboardData?.competitors || [],
    };

    // Export based on format and type
    if (format === 'json') {
      return NextResponse.json(fullData);
    }

    if (format === 'pdf') {
      const htmlContent = generateDashboardPDFContent(fullData);
      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `attachment; filename="dashboard-report-${projectId}.html"`,
        },
      });
    }

    // Excel export
    if (type === 'services') {
      const blob = exportServicesExcel(servicesData, fullData.clinicName);
      const buffer = await blob.arrayBuffer();
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="services-${projectId}.xlsx"`,
        },
      });
    }

    // Full dashboard export
    const blob = exportDashboardExcel(fullData);
    const buffer = await blob.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="dashboard-report-${projectId}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('[API] Export error:', error);
    return NextResponse.json(
      {
        error: 'Failed to export data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
