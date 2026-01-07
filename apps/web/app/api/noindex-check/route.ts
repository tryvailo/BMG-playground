import { NextRequest, NextResponse } from 'next/server';
import { analyzeNoindexPages, type NoindexAnalysisResult } from '~/lib/modules/audit/utils/noindex-crawler';

export const maxDuration = 120;

export const dynamic = 'force-dynamic';

interface NoindexCheckRequest {
  url: string;
  maxPages?: number;
}

interface NoindexCheckSuccessResponse {
  success: true;
  data: NoindexAnalysisResult;
  executionTime: number;
}

interface NoindexCheckErrorResponse {
  success: false;
  error: string;
  code?: string;
}

type NoindexCheckResponse = NoindexCheckSuccessResponse | NoindexCheckErrorResponse;

export async function POST(request: NextRequest): Promise<NextResponse<NoindexCheckResponse>> {
  const startTime = Date.now();

  try {
    const body: NoindexCheckRequest = await request.json();
    const { url, maxPages = 50 } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'URL is required',
          code: 'MISSING_URL',
        },
        { status: 400 },
      );
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return NextResponse.json(
        {
          success: false,
          error: 'URL must start with http:// or https://',
          code: 'INVALID_URL',
        },
        { status: 400 },
      );
    }

    if (maxPages && (maxPages < 1 || maxPages > 200)) {
      return NextResponse.json(
        {
          success: false,
          error: 'maxPages must be between 1 and 200',
          code: 'INVALID_MAX_PAGES',
        },
        { status: 400 },
      );
    }

    console.log(`[NoindexCheck] Starting noindex check for: ${url} (maxPages: ${maxPages})`);

    const result = await analyzeNoindexPages(url, maxPages);

    const executionTime = Math.round((Date.now() - startTime) / 1000);

    console.log(`[NoindexCheck] Analysis complete. Found ${result.noindexCount} noindex pages in ${executionTime}s`);

    return NextResponse.json({
      success: true,
      data: result,
      executionTime,
    });
  } catch (error) {
    console.error('[NoindexCheck] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: 'UNEXPECTED_ERROR',
      },
      { status: 500 },
    );
  }
}
