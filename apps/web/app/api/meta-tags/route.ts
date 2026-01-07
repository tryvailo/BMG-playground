/**
 * API Route: POST /api/meta-tags
 * Analyze meta tags from HTML content
 * Week 4, Days 1-2
 */

import { analyzeMetaTags } from '~/lib/modules/audit/meta-analyzer';
import { analyzeContentStructure } from '~/lib/modules/audit/utils/html-parser';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { html, url } = body;

    if (!html) {
      return NextResponse.json(
        { error: 'HTML content is required', success: false },
        { status: 400 }
      );
    }

    // Analyze meta tags
    const metaTags = analyzeMetaTags(html, url || '');

    // Analyze content structure
    const structure = analyzeContentStructure(html);

    return NextResponse.json(
      {
        data: {
          metaTags,
          structure,
        },
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Meta tags analysis error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required', success: false },
        { status: 400 }
      );
    }

    // Fetch HTML content from the URL
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch URL content', success: false },
        { status: 400 }
      );
    }

    const html = await response.text();

    // Analyze meta tags
    const metaTags = analyzeMetaTags(html, url);

    // Analyze content structure
    const structure = analyzeContentStructure(html);

    return NextResponse.json(
      {
        data: {
          metaTags,
          structure,
        },
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Meta tags analysis error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false,
      },
      { status: 500 }
    );
  }
}
