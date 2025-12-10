import { NextRequest, NextResponse } from 'next/server';

import { enhanceRouteHandler } from '@kit/next/routes';

export const DELETE = enhanceRouteHandler(
  async ({ params, user }) => {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // In real app, delete from database
    return NextResponse.json({ success: true, id });
  },
  {
    auth: true,
  },
);

