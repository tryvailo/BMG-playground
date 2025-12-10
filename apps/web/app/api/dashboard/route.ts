import { NextResponse } from 'next/server';

import { enhanceRouteHandler } from '@kit/next/routes';

import { generateMockHistory, MOCK_COMPETITORS, pieData } from '../../[locale]/home/_components/dashboard-data';

/**
 * GET /api/dashboard
 * Returns dashboard data including KPIs, history, competitors, etc.
 */
export const GET = enhanceRouteHandler(
  async ({ user }) => {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate mock dashboard data
    const history = generateMockHistory();
    const competitors = MOCK_COMPETITORS;
    const coverageType = pieData;

    // Calculate KPIs from mock data
    const avgAivScore = {
      value: 58 + Math.floor(Math.random() * 10),
      change: 5.2,
      isPositive: true,
    };

    const visibleKeywords = {
      value: 84 + Math.floor(Math.random() * 20),
      change: 12,
      isPositive: true,
    };

    const avgPosition = {
      value: 3.2 + Math.random() * 2,
      change: -0.8,
      isPositive: true, // Lower is better
    };

    const competitorGap = {
      value: 12 + Math.floor(Math.random() * 5),
      change: -2.5,
      isPositive: true,
    };

    const dashboardData = {
      kpis: {
        avgAivScore,
        visibleKeywords,
        avgPosition,
        competitorGap,
      },
      history,
      competitors,
      coverageType,
    };

    return NextResponse.json(dashboardData);
  },
  {
    auth: true,
  },
);

