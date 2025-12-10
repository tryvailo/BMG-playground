import { NextRequest, NextResponse } from 'next/server';

import { enhanceRouteHandler } from '@kit/next/routes';

// Mock audit data
const MOCK_AUDIT_RESULT = {
  url: 'https://example-clinic.com',
  overallScore: 72,
  metrics: [
    { category: 'Schema', score: 85, description: 'Good schema markup' },
    { category: 'Performance', score: 78, description: 'Fast loading times' },
    { category: 'Accessibility', score: 65, description: 'Needs improvement' },
    { category: 'Content', score: 80, description: 'Well structured' },
    { category: 'LLMs.txt', score: 45, description: 'Missing llms.txt file' },
    { category: 'Meta Tags', score: 70, description: 'Basic meta tags present' },
  ],
  issues: [
    'Missing llms.txt file at root directory',
    'No MedicalEntity schema markup found',
    'Some pages lack proper meta descriptions',
  ],
};

export const GET = enhanceRouteHandler(
  async ({ request, user }) => {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url') || 'https://example-clinic.com';

    return NextResponse.json({ ...MOCK_AUDIT_RESULT, url });
  },
  {
    auth: true,
  },
);

export const POST = enhanceRouteHandler(
  async ({ request, user }) => {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const url = body.url || 'https://example-clinic.com';

    // Simulate audit processing
    return NextResponse.json({ ...MOCK_AUDIT_RESULT, url });
  },
  {
    auth: true,
  },
);

