/**
 * AI Recommendation Generator
 * Week 5, Days 1-2: Generate AI-powered recommendations for services
 */

import { getOpenAIClient } from './clients';

/**
 * Service data for recommendation generation
 */
export interface ServiceForRecommendation {
  serviceName: string;
  targetPage: string;
  city?: string;
  country?: string;
  visibility_score?: number;
  position?: number;
  aiv_score?: number;
  pagespeed_score?: number;
  pagespeed_metrics?: {
    lcp?: number;
    fcp?: number;
    cls?: number;
    fid?: number;
    ttfb?: number;
  };
  schema_score?: number;
  has_schemas?: string[];
  missing_schemas?: string[];
}

/**
 * Tech audit data for recommendation generation
 */
export interface TechAuditForRecommendation {
  desktop_speed_score?: number;
  mobile_speed_score?: number;
  https_enabled?: boolean;
  mobile_friendly?: boolean;
  llms_txt_present?: boolean;
  llms_txt_score?: number;
  robots_txt_present?: boolean;
  sitemap_present?: boolean;
  schema_summary?: {
    hasMedicalOrganization?: boolean;
    hasPhysician?: boolean;
    hasMedicalProcedure?: boolean;
    hasLocalBusiness?: boolean;
    hasFAQPage?: boolean;
    hasMedicalSpecialty?: boolean;
    hasReview?: boolean;
    hasBreadcrumbList?: boolean;
  };
}

/**
 * Generated recommendation
 */
export interface Recommendation {
  id: string;
  category: 'visibility' | 'technical' | 'content' | 'schema' | 'local' | 'performance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  effort: string;
  steps: string[];
}

/**
 * Recommendation result
 */
export interface RecommendationResult {
  success: boolean;
  recommendations: Recommendation[];
  summary: string;
  generatedAt: string;
  error?: string;
}

/**
 * Build the prompt for service recommendations
 */
function buildServicePrompt(service: ServiceForRecommendation): string {
  return `You are an SEO and AI visibility expert for medical clinics. Analyze the following service data and provide actionable recommendations.

SERVICE DATA:
- Service Name: ${service.serviceName}
- Target Page: ${service.targetPage}
- Location: ${service.city || 'Unknown'}, ${service.country || 'Unknown'}
- Visibility Score: ${service.visibility_score ?? 'Not measured'}%
- Position in AI Results: ${service.position ?? 'Not ranked'}
- AIV Score: ${service.aiv_score ?? 'Not calculated'}
- PageSpeed Score: ${service.pagespeed_score ?? 'Not measured'}
${service.pagespeed_metrics ? `- LCP: ${service.pagespeed_metrics.lcp}ms, FCP: ${service.pagespeed_metrics.fcp}ms, CLS: ${service.pagespeed_metrics.cls}` : ''}
- Schema Score: ${service.schema_score ?? 'Not measured'}%
${service.has_schemas ? `- Present Schemas: ${service.has_schemas.join(', ')}` : ''}
${service.missing_schemas ? `- Missing Schemas: ${service.missing_schemas.join(', ')}` : ''}

Generate 3-5 specific recommendations to improve this service's visibility in AI search results.

Response in JSON format:
{
  "summary": "Brief overall assessment",
  "recommendations": [
    {
      "id": "rec_1",
      "category": "visibility|technical|content|schema|local|performance",
      "priority": "high|medium|low",
      "title": "Short title",
      "description": "Detailed description",
      "impact": "Expected impact",
      "effort": "low|medium|high",
      "steps": ["Step 1", "Step 2", "Step 3"]
    }
  ]
}`;
}

/**
 * Build the prompt for tech audit recommendations
 */
function buildTechAuditPrompt(audit: TechAuditForRecommendation, clinicName?: string): string {
  const schemaStatus = audit.schema_summary
    ? Object.entries(audit.schema_summary)
        .map(([key, value]) => `${key}: ${value ? '✅' : '❌'}`)
        .join(', ')
    : 'Not analyzed';

  return `You are an SEO and technical optimization expert for medical clinics. Analyze the following technical audit data and provide actionable recommendations.

CLINIC: ${clinicName || 'Medical Clinic'}

TECHNICAL AUDIT DATA:
- Desktop Speed Score: ${audit.desktop_speed_score ?? 'Not measured'}/100
- Mobile Speed Score: ${audit.mobile_speed_score ?? 'Not measured'}/100
- HTTPS Enabled: ${audit.https_enabled ? 'Yes' : 'No'}
- Mobile Friendly: ${audit.mobile_friendly ? 'Yes' : 'No'}
- llms.txt Present: ${audit.llms_txt_present ? 'Yes' : 'No'}
- llms.txt Score: ${audit.llms_txt_score ?? 'N/A'}/100
- robots.txt Present: ${audit.robots_txt_present ? 'Yes' : 'No'}
- Sitemap Present: ${audit.sitemap_present ? 'Yes' : 'No'}
- Schema Status: ${schemaStatus}

Generate 3-5 specific technical recommendations to improve this clinic's visibility in AI search results.

Response in JSON format:
{
  "summary": "Brief overall assessment",
  "recommendations": [
    {
      "id": "rec_1",
      "category": "visibility|technical|content|schema|local|performance",
      "priority": "high|medium|low",
      "title": "Short title",
      "description": "Detailed description",
      "impact": "Expected impact",
      "effort": "low|medium|high",
      "steps": ["Step 1", "Step 2", "Step 3"]
    }
  ]
}`;
}

/**
 * Parse OpenAI response safely
 */
function parseRecommendationResponse(content: string): { summary: string; recommendations: Recommendation[] } {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and normalize recommendations
    const recommendations: Recommendation[] = (parsed.recommendations || []).map((rec: Recommendation, index: number) => ({
      id: rec.id || `rec_${index + 1}`,
      category: rec.category || 'technical',
      priority: rec.priority || 'medium',
      title: rec.title || 'Recommendation',
      description: rec.description || '',
      impact: rec.impact || 'Medium impact',
      effort: rec.effort || 'medium',
      steps: rec.steps || [],
    }));

    return {
      summary: parsed.summary || 'Analysis complete.',
      recommendations,
    };
  } catch (error) {
    console.error('[RecommendationGenerator] Failed to parse response:', error);
    return {
      summary: 'Failed to generate recommendations.',
      recommendations: [],
    };
  }
}

/**
 * Generate recommendations for a specific service
 */
export async function generateServiceRecommendations(
  service: ServiceForRecommendation,
): Promise<RecommendationResult> {
  try {
    const openai = getOpenAIClient();
    const prompt = buildServicePrompt(service);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert SEO and AI visibility consultant for medical clinics. Provide actionable, specific recommendations based on the data provided. Always respond in valid JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    const { summary, recommendations } = parseRecommendationResponse(content);

    return {
      success: true,
      recommendations,
      summary,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[RecommendationGenerator] Service recommendation error:', error);
    return {
      success: false,
      recommendations: [],
      summary: '',
      generatedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate recommendations for tech audit
 */
export async function generateTechAuditRecommendations(
  audit: TechAuditForRecommendation,
  clinicName?: string,
): Promise<RecommendationResult> {
  try {
    const openai = getOpenAIClient();
    const prompt = buildTechAuditPrompt(audit, clinicName);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert SEO and technical optimization consultant for medical clinics. Provide actionable, specific recommendations based on the technical audit data. Always respond in valid JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    const { summary, recommendations } = parseRecommendationResponse(content);

    return {
      success: true,
      recommendations,
      summary,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[RecommendationGenerator] Tech audit recommendation error:', error);
    return {
      success: false,
      recommendations: [],
      summary: '',
      generatedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate comprehensive recommendations combining service and tech data
 */
export async function generateComprehensiveRecommendations(
  services: ServiceForRecommendation[],
  techAudit?: TechAuditForRecommendation,
  clinicName?: string,
): Promise<RecommendationResult> {
  try {
    const openai = getOpenAIClient();

    // Build comprehensive prompt
    const servicesData = services.map((s) => ({
      name: s.serviceName,
      visibility: s.visibility_score ?? 0,
      aiv: s.aiv_score ?? 0,
      position: s.position,
    }));

    const avgVisibility = servicesData.reduce((sum, s) => sum + s.visibility, 0) / servicesData.length || 0;
    const avgAIV = servicesData.reduce((sum, s) => sum + s.aiv, 0) / servicesData.length || 0;
    const visibleCount = servicesData.filter((s) => s.visibility > 0).length;

    const prompt = `You are an SEO and AI visibility expert for medical clinics. Analyze the following comprehensive data and provide strategic recommendations.

CLINIC: ${clinicName || 'Medical Clinic'}

SERVICES OVERVIEW:
- Total Services: ${services.length}
- Visible in AI: ${visibleCount}/${services.length} (${((visibleCount / services.length) * 100).toFixed(1)}%)
- Average Visibility: ${avgVisibility.toFixed(1)}%
- Average AIV Score: ${avgAIV.toFixed(1)}

${techAudit ? `TECHNICAL STATUS:
- Desktop Speed: ${techAudit.desktop_speed_score ?? 'N/A'}/100
- Mobile Speed: ${techAudit.mobile_speed_score ?? 'N/A'}/100
- HTTPS: ${techAudit.https_enabled ? '✅' : '❌'}
- Mobile Friendly: ${techAudit.mobile_friendly ? '✅' : '❌'}
- llms.txt: ${techAudit.llms_txt_present ? '✅' : '❌'} (Score: ${techAudit.llms_txt_score ?? 'N/A'})
- robots.txt: ${techAudit.robots_txt_present ? '✅' : '❌'}
- Sitemap: ${techAudit.sitemap_present ? '✅' : '❌'}` : ''}

TOP 3 LOWEST VISIBILITY SERVICES:
${services
  .sort((a, b) => (a.visibility_score ?? 0) - (b.visibility_score ?? 0))
  .slice(0, 3)
  .map((s) => `- ${s.serviceName}: ${s.visibility_score ?? 0}%`)
  .join('\n')}

Generate 5-7 strategic recommendations to improve overall AI visibility for this clinic.

Response in JSON format:
{
  "summary": "Comprehensive assessment of the clinic's AI visibility status",
  "recommendations": [
    {
      "id": "rec_1",
      "category": "visibility|technical|content|schema|local|performance",
      "priority": "high|medium|low",
      "title": "Short title",
      "description": "Detailed description",
      "impact": "Expected impact on visibility metrics",
      "effort": "low|medium|high",
      "steps": ["Step 1", "Step 2", "Step 3"]
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert SEO and AI visibility consultant for medical clinics. Provide strategic, actionable recommendations based on comprehensive analysis. Always respond in valid JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    const { summary, recommendations } = parseRecommendationResponse(content);

    return {
      success: true,
      recommendations,
      summary,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[RecommendationGenerator] Comprehensive recommendation error:', error);
    return {
      success: false,
      recommendations: [],
      summary: '',
      generatedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get priority color for UI display
 */
export function getPriorityColor(priority: Recommendation['priority']): string {
  switch (priority) {
    case 'high':
      return 'text-red-600';
    case 'medium':
      return 'text-amber-600';
    case 'low':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Get priority badge variant for UI display
 */
export function getPriorityBadgeVariant(
  priority: Recommendation['priority'],
): 'destructive' | 'warning' | 'secondary' {
  switch (priority) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'warning';
    case 'low':
      return 'secondary';
    default:
      return 'secondary';
  }
}

/**
 * Get category icon name for UI display
 */
export function getCategoryIcon(category: Recommendation['category']): string {
  switch (category) {
    case 'visibility':
      return 'Eye';
    case 'technical':
      return 'Settings';
    case 'content':
      return 'FileText';
    case 'schema':
      return 'Code';
    case 'local':
      return 'MapPin';
    case 'performance':
      return 'Zap';
    default:
      return 'Info';
  }
}
