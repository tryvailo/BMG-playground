/**
 * Period Comparison API
 * Week 5, Days 4-5: Compare metrics between two periods
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

/**
 * Period metrics
 */
interface PeriodMetrics {
  startDate: string;
  endDate: string;
  avgClinicAIScore: number;
  avgVisibility: number;
  avgTechScore: number;
  avgContentScore: number;
  avgEeatScore: number;
  avgLocalScore: number;
  servicesCount: number;
  visibleServicesCount: number;
}

/**
 * Comparison result
 */
interface ComparisonResult {
  period1: PeriodMetrics;
  period2: PeriodMetrics;
  changes: {
    clinicAIScore: number;
    visibility: number;
    techScore: number;
    contentScore: number;
    eeatScore: number;
    localScore: number;
    servicesCount: number;
    visibleServicesCount: number;
  };
  percentChanges: {
    clinicAIScore: number;
    visibility: number;
    techScore: number;
    contentScore: number;
    eeatScore: number;
    localScore: number;
    servicesCount: number;
    visibleServicesCount: number;
  };
  summary: string;
}

/**
 * Calculate average from array of numbers
 */
function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate percentage change
 */
function percentChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) {
    return newValue > 0 ? 100 : 0;
  }
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Get metrics for a period
 */
async function getPeriodMetrics(
  projectId: string,
  startDate: string,
  endDate: string,
): Promise<PeriodMetrics> {
  const supabase = getSupabaseClient();

  // Get weekly stats for the period
  const { data: weeklyStats, error } = await supabase
    .from('weekly_stats')
    .select('*')
    .eq('project_id', projectId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('[PeriodComparison] Error fetching weekly stats:', error);
  }

  const stats = weeklyStats || [];

  // Get services data for the period
  const { data: services } = await supabase
    .from('services')
    .select('visibility_score')
    .eq('project_id', projectId);

  const servicesData = services || [];
  const visibleServices = servicesData.filter((s) => (s.visibility_score || 0) > 0);

  return {
    startDate,
    endDate,
    avgClinicAIScore: avg(stats.map((s) => s.clinic_ai_score || 0)),
    avgVisibility: avg(stats.map((s) => s.visibility || 0)),
    avgTechScore: avg(stats.map((s) => s.tech_score || 0)),
    avgContentScore: avg(stats.map((s) => s.content_score || 0)),
    avgEeatScore: avg(stats.map((s) => s.eeat_score || 0)),
    avgLocalScore: avg(stats.map((s) => s.local_score || 0)),
    servicesCount: servicesData.length,
    visibleServicesCount: visibleServices.length,
  };
}

/**
 * Generate summary text based on changes
 */
function generateSummary(changes: ComparisonResult['percentChanges']): string {
  const improvements: string[] = [];
  const declines: string[] = [];

  if (changes.clinicAIScore > 5) improvements.push('ClinicAI Score');
  else if (changes.clinicAIScore < -5) declines.push('ClinicAI Score');

  if (changes.visibility > 5) improvements.push('Visibility');
  else if (changes.visibility < -5) declines.push('Visibility');

  if (changes.techScore > 5) improvements.push('Tech Score');
  else if (changes.techScore < -5) declines.push('Tech Score');

  if (changes.contentScore > 5) improvements.push('Content Score');
  else if (changes.contentScore < -5) declines.push('Content Score');

  if (changes.visibleServicesCount > 0) improvements.push('Visible Services');
  else if (changes.visibleServicesCount < 0) declines.push('Visible Services');

  let summary = '';

  if (improvements.length > 0 && declines.length === 0) {
    summary = `Great progress! ${improvements.join(', ')} improved significantly.`;
  } else if (declines.length > 0 && improvements.length === 0) {
    summary = `Attention needed: ${declines.join(', ')} declined.`;
  } else if (improvements.length > 0 && declines.length > 0) {
    summary = `Mixed results: ${improvements.join(', ')} improved, but ${declines.join(', ')} declined.`;
  } else {
    summary = 'Metrics remained relatively stable between periods.';
  }

  return summary;
}

/**
 * POST /api/dashboard/compare
 * Compare metrics between two periods
 * 
 * Body:
 * {
 *   projectId: string,
 *   period1: { startDate: string, endDate: string },
 *   period2: { startDate: string, endDate: string }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, period1, period2 } = body;

    if (!projectId || !period1 || !period2) {
      return NextResponse.json(
        { error: 'projectId, period1, and period2 are required' },
        { status: 400 },
      );
    }

    // Get metrics for both periods
    const metrics1 = await getPeriodMetrics(projectId, period1.startDate, period1.endDate);
    const metrics2 = await getPeriodMetrics(projectId, period2.startDate, period2.endDate);

    // Calculate changes
    const changes = {
      clinicAIScore: metrics2.avgClinicAIScore - metrics1.avgClinicAIScore,
      visibility: metrics2.avgVisibility - metrics1.avgVisibility,
      techScore: metrics2.avgTechScore - metrics1.avgTechScore,
      contentScore: metrics2.avgContentScore - metrics1.avgContentScore,
      eeatScore: metrics2.avgEeatScore - metrics1.avgEeatScore,
      localScore: metrics2.avgLocalScore - metrics1.avgLocalScore,
      servicesCount: metrics2.servicesCount - metrics1.servicesCount,
      visibleServicesCount: metrics2.visibleServicesCount - metrics1.visibleServicesCount,
    };

    // Calculate percentage changes
    const percentChanges = {
      clinicAIScore: percentChange(metrics1.avgClinicAIScore, metrics2.avgClinicAIScore),
      visibility: percentChange(metrics1.avgVisibility, metrics2.avgVisibility),
      techScore: percentChange(metrics1.avgTechScore, metrics2.avgTechScore),
      contentScore: percentChange(metrics1.avgContentScore, metrics2.avgContentScore),
      eeatScore: percentChange(metrics1.avgEeatScore, metrics2.avgEeatScore),
      localScore: percentChange(metrics1.avgLocalScore, metrics2.avgLocalScore),
      servicesCount: percentChange(metrics1.servicesCount, metrics2.servicesCount),
      visibleServicesCount: percentChange(metrics1.visibleServicesCount, metrics2.visibleServicesCount),
    };

    const result: ComparisonResult = {
      period1: metrics1,
      period2: metrics2,
      changes,
      percentChanges,
      summary: generateSummary(percentChanges),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Period comparison error:', error);
    return NextResponse.json(
      {
        error: 'Failed to compare periods',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/dashboard/compare
 * Quick comparison with predefined periods
 * 
 * Query params:
 * - projectId: string (required)
 * - preset: 'week' | 'month' | 'quarter' (default: 'week')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const preset = searchParams.get('preset') || 'week';

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 },
      );
    }

    const now = new Date();
    let period1Start: Date;
    let period1End: Date;
    let period2Start: Date;
    let period2End: Date;

    switch (preset) {
      case 'week':
        // This week vs last week
        period2End = now;
        period2Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        period1End = period2Start;
        period1Start = new Date(period2Start.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;

      case 'month':
        // This month vs last month
        period2End = now;
        period2Start = new Date(now.getFullYear(), now.getMonth(), 1);
        period1End = new Date(period2Start.getTime() - 1);
        period1Start = new Date(period1End.getFullYear(), period1End.getMonth(), 1);
        break;

      case 'quarter': {
        // This quarter vs last quarter
        const currentQuarter = Math.floor(now.getMonth() / 3);
        period2Start = new Date(now.getFullYear(), currentQuarter * 3, 1);
        period2End = now;
        period1End = new Date(period2Start.getTime() - 1);
        period1Start = new Date(period1End.getFullYear(), Math.floor(period1End.getMonth() / 3) * 3, 1);
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid preset. Use: week, month, or quarter' },
          { status: 400 },
        );
    }

    // Get metrics for both periods
    const metrics1 = await getPeriodMetrics(
      projectId,
      period1Start.toISOString().split('T')[0]!,
      period1End.toISOString().split('T')[0]!,
    );
    const metrics2 = await getPeriodMetrics(
      projectId,
      period2Start.toISOString().split('T')[0]!,
      period2End.toISOString().split('T')[0]!,
    );

    // Calculate changes
    const changes = {
      clinicAIScore: metrics2.avgClinicAIScore - metrics1.avgClinicAIScore,
      visibility: metrics2.avgVisibility - metrics1.avgVisibility,
      techScore: metrics2.avgTechScore - metrics1.avgTechScore,
      contentScore: metrics2.avgContentScore - metrics1.avgContentScore,
      eeatScore: metrics2.avgEeatScore - metrics1.avgEeatScore,
      localScore: metrics2.avgLocalScore - metrics1.avgLocalScore,
      servicesCount: metrics2.servicesCount - metrics1.servicesCount,
      visibleServicesCount: metrics2.visibleServicesCount - metrics1.visibleServicesCount,
    };

    const percentChanges = {
      clinicAIScore: percentChange(metrics1.avgClinicAIScore, metrics2.avgClinicAIScore),
      visibility: percentChange(metrics1.avgVisibility, metrics2.avgVisibility),
      techScore: percentChange(metrics1.avgTechScore, metrics2.avgTechScore),
      contentScore: percentChange(metrics1.avgContentScore, metrics2.avgContentScore),
      eeatScore: percentChange(metrics1.avgEeatScore, metrics2.avgEeatScore),
      localScore: percentChange(metrics1.avgLocalScore, metrics2.avgLocalScore),
      servicesCount: percentChange(metrics1.servicesCount, metrics2.servicesCount),
      visibleServicesCount: percentChange(metrics1.visibleServicesCount, metrics2.visibleServicesCount),
    };

    const result: ComparisonResult = {
      period1: metrics1,
      period2: metrics2,
      changes,
      percentChanges,
      summary: generateSummary(percentChanges),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Period comparison GET error:', error);
    return NextResponse.json(
      {
        error: 'Failed to compare periods',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
