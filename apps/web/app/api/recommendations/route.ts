/**
 * AI Recommendations API
 * Week 5, Days 1-2: Generate AI-powered recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateServiceRecommendations,
  generateTechAuditRecommendations,
  generateComprehensiveRecommendations,
  type ServiceForRecommendation,
  type TechAuditForRecommendation,
} from '~/lib/modules/ai/recommendation-generator';
import { getServicesByProjectId, getServiceById } from '~/lib/modules/services/service-repository';
import { getTechAuditByProjectId } from '~/lib/modules/audit/tech-audit-service';

/**
 * GET /api/recommendations
 * Generate recommendations for a project or specific service
 * 
 * Query params:
 * - projectId: string (required)
 * - serviceId?: string (optional, for service-specific recommendations)
 * - type: 'service' | 'tech' | 'comprehensive' (default: 'comprehensive')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const serviceId = searchParams.get('serviceId');
    const type = searchParams.get('type') || 'comprehensive';

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 },
      );
    }

    // Service-specific recommendations
    if (type === 'service' && serviceId) {
      const service = await getServiceById(serviceId);
      if (!service) {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 },
        );
      }

      const serviceData: ServiceForRecommendation = {
        serviceName: service.service_name,
        targetPage: service.target_page,
        city: service.city,
        country: service.country,
        visibility_score: service.visibility_score,
        position: service.position,
        aiv_score: service.aiv_score,
      };

      const result = await generateServiceRecommendations(serviceData);
      return NextResponse.json(result);
    }

    // Tech audit recommendations
    if (type === 'tech') {
      const techAudit = await getTechAuditByProjectId(projectId);
      if (!techAudit) {
        return NextResponse.json(
          { error: 'No tech audit found for this project' },
          { status: 404 },
        );
      }

      const auditData: TechAuditForRecommendation = {
        desktop_speed_score: techAudit.desktop_speed_score ?? undefined,
        mobile_speed_score: techAudit.mobile_speed_score ?? undefined,
        https_enabled: techAudit.https_enabled ?? undefined,
        mobile_friendly: techAudit.mobile_friendly ?? undefined,
        llms_txt_present: techAudit.llms_txt_present ?? undefined,
        llms_txt_score: techAudit.llms_txt_score ?? undefined,
        robots_txt_present: techAudit.robots_txt_present ?? undefined,
        sitemap_present: techAudit.sitemap_present ?? undefined,
        schema_summary: techAudit.schema_summary ?? undefined,
      };

      const result = await generateTechAuditRecommendations(auditData);
      return NextResponse.json(result);
    }

    // Comprehensive recommendations (default)
    const services = await getServicesByProjectId(projectId);
    const techAudit = await getTechAuditByProjectId(projectId);

    const servicesData: ServiceForRecommendation[] = services.map((s) => ({
      serviceName: s.service_name,
      targetPage: s.target_page,
      city: s.city,
      country: s.country,
      visibility_score: s.visibility_score,
      position: s.position,
      aiv_score: s.aiv_score,
    }));

    const auditData: TechAuditForRecommendation | undefined = techAudit
      ? {
          desktop_speed_score: techAudit.desktop_speed_score ?? undefined,
          mobile_speed_score: techAudit.mobile_speed_score ?? undefined,
          https_enabled: techAudit.https_enabled ?? undefined,
          mobile_friendly: techAudit.mobile_friendly ?? undefined,
          llms_txt_present: techAudit.llms_txt_present ?? undefined,
          llms_txt_score: techAudit.llms_txt_score ?? undefined,
          robots_txt_present: techAudit.robots_txt_present ?? undefined,
          sitemap_present: techAudit.sitemap_present ?? undefined,
          schema_summary: techAudit.schema_summary ?? undefined,
        }
      : undefined;

    const result = await generateComprehensiveRecommendations(
      servicesData,
      auditData,
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Recommendations error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate recommendations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/recommendations
 * Generate recommendations from provided data (without DB lookup)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, service, techAudit, services, clinicName } = body;

    if (type === 'service' && service) {
      const result = await generateServiceRecommendations(service);
      return NextResponse.json(result);
    }

    if (type === 'tech' && techAudit) {
      const result = await generateTechAuditRecommendations(techAudit, clinicName);
      return NextResponse.json(result);
    }

    if (type === 'comprehensive' && services) {
      const result = await generateComprehensiveRecommendations(
        services,
        techAudit,
        clinicName,
      );
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: 'Invalid request. Provide type and corresponding data.' },
      { status: 400 },
    );
  } catch (error) {
    console.error('[API] Recommendations POST error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate recommendations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
