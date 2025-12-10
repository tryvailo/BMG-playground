import { NextResponse } from 'next/server';

import { enhanceRouteHandler } from '@kit/next/routes';

// Mock reports data
const MOCK_REPORTS = [
  {
    id: '1',
    name: 'November Weekly Summary',
    type: 'Weekly Summary',
    dateCreated: '2024-11-29',
    status: 'Ready' as const,
    size: '2.4 MB',
  },
  {
    id: '2',
    name: 'Competitor Analysis Q4',
    type: 'Competitor Analysis',
    dateCreated: '2024-11-25',
    status: 'Ready' as const,
    size: '5.1 MB',
  },
  {
    id: '3',
    name: 'Technical Audit Report',
    type: 'Technical Audit',
    dateCreated: '2024-11-20',
    status: 'Ready' as const,
    size: '1.8 MB',
  },
];

export const GET = enhanceRouteHandler(
  async ({ user }) => {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ reports: MOCK_REPORTS });
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
    const newReport = {
      id: Date.now().toString(),
      name: body.name || `${body.type} - ${new Date().toLocaleDateString()}`,
      type: body.type,
      dateCreated: new Date().toISOString().split('T')[0],
      status: 'Processing' as const,
    };

    // Simulate processing - in real app, this would trigger background job
    return NextResponse.json(newReport);
  },
  {
    auth: true,
  },
);

