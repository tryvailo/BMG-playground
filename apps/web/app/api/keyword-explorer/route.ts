import { NextResponse } from 'next/server';

import { enhanceRouteHandler } from '@kit/next/routes';

// Mock data
const MOCK_OPPORTUNITIES = [
  {
    id: '1',
    prompt: 'cost of dental implants in NYC',
    volume: 85,
    difficulty: 45,
    potentialImpact: 'High' as const,
  },
  {
    id: '2',
    prompt: 'pain free dentist near me',
    volume: 72,
    difficulty: 38,
    potentialImpact: 'High' as const,
  },
  {
    id: '3',
    prompt: 'best orthodontist for adults',
    volume: 65,
    difficulty: 52,
    potentialImpact: 'Medium' as const,
  },
  {
    id: '4',
    prompt: 'root canal recovery time',
    volume: 58,
    difficulty: 28,
    potentialImpact: 'High' as const,
  },
  {
    id: '5',
    prompt: 'teeth whitening side effects',
    volume: 45,
    difficulty: 35,
    potentialImpact: 'Medium' as const,
  },
];

export const GET = enhanceRouteHandler(
  async ({ request, user }) => {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // Filter by search term if provided
    let opportunities = MOCK_OPPORTUNITIES;
    if (search) {
      opportunities = MOCK_OPPORTUNITIES.filter(opp => 
        opp.prompt.toLowerCase().includes(search.toLowerCase())
      );
    }

    return NextResponse.json({ opportunities });
  },
  {
    auth: true,
  },
);

