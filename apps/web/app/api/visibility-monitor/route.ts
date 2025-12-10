import { NextResponse } from 'next/server';

import { enhanceRouteHandler } from '@kit/next/routes';

// Mock data
const MOCK_RESULTS = [
  {
    id: '1',
    keyword: 'dental implants NYC',
    aiResponseSource: 'ChatGPT',
    aivScore: 72,
    status: 'VISIBLE' as const,
    rank: 2,
    topCompetitor: 'City Dental Care',
    date: '2024-11-29',
  },
  {
    id: '2',
    keyword: 'root canal treatment',
    aiResponseSource: 'Perplexity',
    aivScore: 45,
    status: 'PARTIAL' as const,
    rank: 5,
    topCompetitor: 'Smile Experts',
    date: '2024-11-28',
  },
  {
    id: '3',
    keyword: 'teeth whitening',
    aiResponseSource: 'Gemini',
    aivScore: 88,
    status: 'VISIBLE' as const,
    rank: 1,
    topCompetitor: 'MediClinic Plus',
    date: '2024-11-27',
  },
];

export const GET = enhanceRouteHandler(
  async ({ user }) => {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ results: MOCK_RESULTS });
  },
  {
    auth: true,
  },
);

export const POST = enhanceRouteHandler(
  async ({ user }) => {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simulate scan processing
    return NextResponse.json({ success: true, message: 'Scan started' });
  },
  {
    auth: true,
  },
);

