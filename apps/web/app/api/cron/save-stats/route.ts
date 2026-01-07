import { NextResponse } from 'next/server';

import { saveWeeklyStatsForAllProjects } from '~/lib/modules/dashboard/weekly-stats-service';

/**
 * POST /api/cron/save-stats
 * 
 * Cron job endpoint to save weekly stats for all projects
 * 
 * Triggered by Vercel Cron (configured in vercel.json)
 * Runs bi-weekly (every 2 weeks) on Monday at midnight UTC
 * 
 * Authorization: Vercel cron secret in header
 */
export async function POST(request: Request) {
  try {
    // Verify Vercel cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      console.warn('[Cron] Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    console.log('[Cron] Starting weekly stats save job');

    const startTime = Date.now();

    // Execute the job
    await saveWeeklyStatsForAllProjects();

    const duration = Date.now() - startTime;

    console.log('[Cron] ✅ Weekly stats save completed in', duration, 'ms');

    return NextResponse.json({
      success: true,
      message: 'Weekly stats saved successfully',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error in save-stats:', error);

    return NextResponse.json(
      {
        error: 'Failed to save weekly stats',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint for manual testing
 */
export async function GET() {
  return NextResponse.json({
    message: 'Cron save-stats endpoint',
    method: 'POST',
    description: 'Saves weekly stats for all projects',
    authorization: 'Bearer CRON_SECRET',
  });
}
