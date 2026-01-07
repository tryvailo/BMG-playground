/**
 * API Route: POST /api/schema-audit
 * Validate schema.org structured data
 * Week 3, Days 3: Tech Audit
 */

import { validateSchemas } from '~/lib/modules/audit/schema-validator';
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

    // Validate schemas in HTML
    const result = validateSchemas(html);
    result.url = url || '';

    return NextResponse.json(
      {
        data: result,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Schema audit error:', error);
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

    // Validate schemas
    const result = validateSchemas(html);
    result.url = url;

    return NextResponse.json(
      {
        data: result,
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Schema audit error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false,
      },
      { status: 500 }
    );
  }
}
