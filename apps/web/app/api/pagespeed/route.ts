/**
 * API Route: GET /api/pagespeed
 * Fetch PageSpeed scores for a URL
 * Week 3, Days 1-2
 */

import { getPageSpeedScore } from '~/lib/modules/audit/pagespeed-integration';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60; // Allow up to 60 seconds for PageSpeed API

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const strategy = (searchParams.get('strategy') as 'desktop' | 'mobile' | 'both') || 'both';

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required', success: false },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format', success: false },
        { status: 400 }
      );
    }

    // Get PageSpeed score
    const result = await getPageSpeedScore(url, strategy);

    return NextResponse.json(
      {
        data: result,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PageSpeed API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, strategy = 'both' } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required', success: false },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format', success: false },
        { status: 400 }
      );
    }

    // Get PageSpeed score
    const result = await getPageSpeedScore(url, strategy);

    return NextResponse.json(
      {
        data: result,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('PageSpeed API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false,
      },
      { status: 500 }
    );
  }
}
