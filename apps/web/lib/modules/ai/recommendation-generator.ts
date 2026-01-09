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
  return `You are a professional SEO & GEO specialist analyzing medical service visibility in LLM responses.

ANALYZE THIS SERVICE FOR GEO OPTIMIZATION:
- Service Name: ${service.serviceName}
- Target Page: ${service.targetPage}
- Geographic Focus: ${service.city || 'Unknown'}, ${service.country || 'Unknown'}
- Current LLM Visibility: ${service.visibility_score ?? 'Unknown'}%
- AI Ranking Position: ${service.position ?? 'Not visible'}
- AIV Score: ${service.aiv_score ?? 'Not calculated'}
- Page Performance: ${service.pagespeed_score ?? 'Unknown'}/100
${service.pagespeed_metrics ? `  └─ LCP: ${service.pagespeed_metrics.lcp}ms, FCP: ${service.pagespeed_metrics.fcp}ms, CLS: ${service.pagespeed_metrics.cls}` : ''}
- Medical Schema Score: ${service.schema_score ?? 'Unknown'}%
${service.has_schemas ? `- Implemented: ${service.has_schemas.join(', ')}` : '- No medical schema detected'}
${service.missing_schemas ? `- Missing: ${service.missing_schemas.join(', ')}` : ''}

GEO OPTIMIZATION PRIORITIES FOR SERVICES:
1. Medical Procedure Schema: Ensures LLMs understand exactly what procedure is offered
2. Geographic Targeting: Service area scope must match LLM location queries
3. EEAT Signals: Doctor credentials, experience, outcomes for authority
4. Performance: Fast page load = better LLM crawlability
5. Local Schema: Link service to specific clinic location(s)

RECOMMENDATION REQUIREMENTS:
- Be specific: Include schema names (MedicalProcedure, LocalBusiness, etc.)
- Medical context: Reference medical procedures/conditions, not generic services
- GEO-focused: Emphasize LLM visibility improvement
- Actionable: Exact steps, not vague advice
- Prioritized: Most impactful recommendations first

Examples of GOOD recommendations:
✓ "Implement MedicalProcedure schema for '${service.serviceName}' with conditions treated, expected outcomes, and link to Doctor profiles with credentials"
✓ "Add geographic service area scope to LocalBusiness schema: expand from '${service.city}' to define 15km service radius for LLM location queries"
✓ "Create service page with 3+ internal links from clinic's main pages to improve crawl priority for LLM systems"

Generate 3-5 prioritized, GEO-focused recommendations.

Response in JSON format:
{
  "summary": "GEO assessment and priority actions",
  "recommendations": [

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

  return `You are a professional SEO & GEO (Generative Engine Optimization) specialist for medical organizations. Your task: provide strategic recommendations for ${clinicName || 'Medical Clinic'} to increase visibility in LLM responses (ChatGPT, Perplexity, Claude).

CLINIC: ${clinicName || 'Medical Clinic'}

CURRENT TECHNICAL STATUS:
- Desktop Speed Score: ${audit.desktop_speed_score ?? 'Not measured'}/100
- Mobile Speed Score: ${audit.mobile_speed_score ?? 'Not measured'}/100
- HTTPS Security: ${audit.https_enabled ? '✅ Enabled' : '❌ Missing'}
- Mobile Optimization: ${audit.mobile_friendly ? '✅ Responsive' : '❌ Not mobile-friendly'}
- llms.txt File: ${audit.llms_txt_present ? `✅ Present (Score: ${audit.llms_txt_score ?? 'N/A'}/100)` : '❌ Missing (GEO blocker)'}
- robots.txt: ${audit.robots_txt_present ? '✅ Configured' : '❌ Missing'}
- XML Sitemap: ${audit.sitemap_present ? '✅ Present' : '❌ Missing'}
- Medical Authority Schema: ${schemaStatus}

PRIORITY FOR RECOMMENDATIONS:
1. GEO Visibility (most critical for medical AI visibility)
2. Medical Authority Signals (EEAT for healthcare)
3. Technical Performance (affects crawlability)
4. Local SEO Precision (geographic targeting)

INSTRUCTIONS FOR RECOMMENDATIONS:
- Be specific: Include field names, schema types, exact metrics
- Priority-ranked: Address GEO blockers first (e.g., llms.txt missing = prevents LLM indexation)
- Medical context: Reference medical schema types, not generic recommendations
- Actionable: Each recommendation must have clear steps or specifications
- Professional tone: Use SEO/GEO terminology, not generic advice

Example GOOD recommendations:
✓ "Create llms.txt with MedicalBusiness schema and 'Doctors' section listing 5+ specialists with license numbers and ICD-10 specializations"
✓ "Implement Hospital schema with 3+ locations, full addresses with postal codes, and operating hours for geographic targeting"
✓ "Add Doctor profiles with credential schema including degree level, specialization registry, and licensing authority for authority signals"

Example BAD recommendations (avoid):
✗ "Improve website speed" (vague, no metrics)
✗ "Add more content" (not specific to medical schema)
✗ "Optimize for search engines" (generic, not GEO-focused)

Generate 3-5 specific, prioritized technical recommendations.

Response in JSON format:
{
  "summary": "Professional assessment (2-3 sentences) focused on GEO visibility",
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
          content: 'You are a professional SEO & GEO specialist for medical organizations. Provide specific, technical recommendations for LLM visibility. Always respond in valid JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
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
          content: 'You are a professional SEO & GEO specialist for medical organizations. Provide specific, professional recommendations based on industry best practices. Always respond in valid JSON format with actionable, technical guidance.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
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

    const prompt = `You are a professional SEO & GEO (Generative Engine Optimization) specialist for medical organizations. Your role: provide strategic GEO recommendations for ${clinicName || 'Medical Clinic'} to dominate LLM visibility.

CLINIC PERFORMANCE SUMMARY:
Organization: ${clinicName || 'Medical Clinic'}

SERVICE PORTFOLIO ANALYSIS:
- Total Services: ${services.length}
- AI-Visible Services: ${visibleCount}/${services.length} (${((visibleCount / services.length) * 100).toFixed(1)}% visibility rate)
- Average LLM Visibility: ${avgVisibility.toFixed(1)}%
- Average AIV Score: ${avgAIV.toFixed(1)} (lower = more room for improvement)

⚠️ LOW PERFORMERS (Opportunities):
${services
  .sort((a, b) => (a.visibility_score ?? 0) - (b.visibility_score ?? 0))
  .slice(0, 3)
  .map((s) => `- ${s.serviceName}: ${s.visibility_score ?? 0}% LLM visibility (needs ${100 - (s.visibility_score ?? 0)} point improvement)`)
  .join('\n')}

${techAudit ? `TECHNICAL FOUNDATION ASSESSMENT:
- Desktop Performance: ${techAudit.desktop_speed_score ?? 'N/A'}/100 (target: 80+)
- Mobile Performance: ${techAudit.mobile_speed_score ?? 'N/A'}/100 (critical for LLM crawlers)
- Security (HTTPS): ${techAudit.https_enabled ? '✅ Enabled' : '❌ Missing - blocks LLM crawling'}
- Mobile Responsive: ${techAudit.mobile_friendly ? '✅ Yes' : '❌ No - major GEO issue'}
- llms.txt Optimization: ${techAudit.llms_txt_present ? `✅ Present (Score: ${techAudit.llms_txt_score ?? 'N/A'}/100)` : '❌ MISSING - primary GEO blocker'}
- robots.txt Configuration: ${techAudit.robots_txt_present ? '✅ Configured' : '❌ Missing'}
- XML Sitemap: ${techAudit.sitemap_present ? '✅ Present' : '❌ Missing - reduces crawl efficiency'}` : ''}

STRATEGIC FOCUS AREAS:
1. Eliminate GEO Blockers (prevent LLM discovery)
2. Boost Low-Visibility Services (prioritize top 3 below 30% visibility)
3. Strengthen Medical Authority Signals (EEAT for healthcare credibility)
4. Optimize Geographic Targeting (local schema for location-based queries)
5. Improve Technical Foundation (crawlability and performance)

RECOMMENDATION REQUIREMENTS:
- Strategic: Not tactical - focus on highest-impact improvements
- Specific: Include metrics, schema names, exact field requirements
- Prioritized: Rank by GEO business impact (what drives LLM traffic)
- Medical context: Reference medical procedures, conditions, credentials
- Professional: Use industry terminology (GEO, schema markup, EEAT, etc.)

Examples of STRATEGIC recommendations:
✓ "Revise llms.txt: add 'Doctors' section with 7+ credentials (specialization + license number) - currently unoptimized, blocking authority signals"
✓ "Implement MultiLocation MedicalBusiness schema for 3 clinics with full local address/phone - low-visibility 'Cardiology' service needs geographic service area scope"
✓ "Create service hierarchy: procedure schema linking to Doctor profiles with credentials - AI models can't associate procedures with qualified practitioners"

Generate 5-7 strategic GEO recommendations ranked by impact.

Response in JSON format:
{
  "summary": "Professional GEO assessment of clinic's AI visibility potential and top 3 priorities",
  "recommendations": [
    {
      "id": "rec_1",
      "category": "visibility|technical|content|schema|local|performance",
      "priority": "high|medium|low",
      "title": "Strategic action title",
      "description": "Detailed description with metrics and business context",
      "impact": "Expected GEO business impact",
      "effort": "low|medium|high",
      "steps": ["Specific actionable step", "Next step with details"]
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional SEO & GEO specialist for medical organizations. Provide strategic, specific recommendations for LLM visibility improvement. Always respond in valid JSON format with technical precision.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
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
