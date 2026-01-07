/**
 * Google PageSpeed Insights API Integration
 * Week 3, Days 1-2
 */



export interface PageSpeedMetrics {
  lcp: number; // Largest Contentful Paint (ms)
  fcp: number; // First Contentful Paint (ms)
  cls: number; // Cumulative Layout Shift (0-1)
  fid: number; // First Input Delay (ms)
  ttfb: number; // Time to First Byte (ms)
  tti: number; // Time to Interactive (ms)
}

export interface PageSpeedResult {
  url: string;
  strategy: 'mobile' | 'desktop';
  score: number; // 0-100
  metrics: PageSpeedMetrics;
  timestamp: Date;
  status: 'success' | 'error';
  errorMessage?: string;
}

export interface PageSpeedAnalysis {
  url: string;
  desktopScore: number;
  mobileScore: number;
  desktopMetrics: PageSpeedMetrics;
  mobileMetrics: PageSpeedMetrics;
  avgScore: number; // Average of desktop and mobile
  passed: boolean; // score > 50
  timestamp: Date;
}

/**
 * Get PageSpeed score for a URL (desktop + mobile)
 * Fetches from Google PageSpeed Insights API
 */
export async function getPageSpeedScore(
  url: string,
  strategy: 'desktop' | 'mobile' | 'both' = 'both'
): Promise<PageSpeedAnalysis | PageSpeedResult> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;

  if (!apiKey) {
    console.warn('GOOGLE_PAGESPEED_API_KEY not configured');
    return getMockPageSpeedScore(url);
  }

  try {
    // Validate URL
    const parsedUrl = new URL(url);
    const encodedUrl = encodeURIComponent(parsedUrl.toString());

    if (strategy === 'both') {
      const [desktopResult, mobileResult] = await Promise.all([
        fetchPageSpeedData(encodedUrl, 'desktop', apiKey),
        fetchPageSpeedData(encodedUrl, 'mobile', apiKey),
      ]);

      if (desktopResult.status === 'error' || mobileResult.status === 'error') {
        return {
          ...desktopResult,
          status: 'error',
          errorMessage: 'Failed to fetch PageSpeed data',
        };
      }

      const analysis: PageSpeedAnalysis = {
        url,
        desktopScore: desktopResult.score,
        mobileScore: mobileResult.score,
        desktopMetrics: desktopResult.metrics,
        mobileMetrics: mobileResult.metrics,
        avgScore: Math.round((desktopResult.score + mobileResult.score) / 2),
        passed: desktopResult.score > 50 && mobileResult.score > 50,
        timestamp: new Date(),
      };

      return analysis;
    } else {
      return fetchPageSpeedData(encodedUrl, strategy, apiKey);
    }
  } catch (error) {
    console.error('PageSpeed API error:', error);
    return {
      url,
      strategy: strategy === 'both' ? 'mobile' : strategy,
      score: 0,
      metrics: {
        lcp: 0,
        fcp: 0,
        cls: 0,
        fid: 0,
        ttfb: 0,
        tti: 0,
      },
      timestamp: new Date(),
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch PageSpeed data from Google API
 */
async function fetchPageSpeedData(
  encodedUrl: string,
  strategy: 'desktop' | 'mobile',
  apiKey: string
): Promise<PageSpeedResult> {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodedUrl}&strategy=${strategy}&key=${apiKey}`;

  const response = await fetch(apiUrl);
  const data = await response.json();

  if (data.error) {
    return {
      url: decodeURIComponent(encodedUrl),
      strategy,
      score: 0,
      metrics: {
        lcp: 0,
        fcp: 0,
        cls: 0,
        fid: 0,
        ttfb: 0,
        tti: 0,
      },
      timestamp: new Date(),
      status: 'error',
      errorMessage: data.error.message,
    };
  }

  // Extract metrics from PageSpeed API response
  const lighthouseResult = data.lighthouseResult;
  const metrics = lighthouseResult.audits.metrics.details.items[0];

  return {
    url: decodeURIComponent(encodedUrl),
    strategy,
    score: Math.round(lighthouseResult.categories.performance.score * 100),
    metrics: {
      lcp: metrics.largestContentfulPaint || 0,
      fcp: metrics.firstContentfulPaint || 0,
      cls: metrics.cumulativeLayoutShift || 0,
      fid: metrics.firstInputDelay || 0,
      ttfb: metrics.timeToFirstByte || 0,
      tti: metrics.interactive || 0,
    },
    timestamp: new Date(),
    status: 'success',
  };
}

/**
 * Mock PageSpeed score for development
 */
export function getMockPageSpeedScore(url: string): PageSpeedAnalysis {
  const score = Math.floor(Math.random() * 40) + 60; // 60-100
  const mobileScore = Math.max(score - 15, 40); // Slightly lower for mobile

  return {
    url,
    desktopScore: score,
    mobileScore,
    desktopMetrics: {
      lcp: Math.floor(Math.random() * 2000) + 500,
      fcp: Math.floor(Math.random() * 1000) + 300,
      cls: Math.random() * 0.2,
      fid: Math.floor(Math.random() * 100) + 20,
      ttfb: Math.floor(Math.random() * 500) + 100,
      tti: Math.floor(Math.random() * 3000) + 1000,
    },
    mobileMetrics: {
      lcp: Math.floor(Math.random() * 3000) + 800,
      fcp: Math.floor(Math.random() * 1500) + 500,
      cls: Math.random() * 0.3,
      fid: Math.floor(Math.random() * 150) + 50,
      ttfb: Math.floor(Math.random() * 800) + 200,
      tti: Math.floor(Math.random() * 4000) + 2000,
    },
    avgScore: Math.round((score + mobileScore) / 2),
    passed: score > 50 && mobileScore > 50,
    timestamp: new Date(),
  };
}

/**
 * Get score badge variant for UI
 */
export function getPageSpeedBadgeVariant(
  score: number
): 'success' | 'warning' | 'destructive' | 'outline' {
  if (score >= 90) return 'success';
  if (score >= 50) return 'warning';
  return 'destructive';
}

/**
 * Get score rating text
 */
export function getPageSpeedRating(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 50) return 'Needs Improvement';
  return 'Poor';
}

/**
 * Get metric rating
 */
export function getMetricRating(
  metric: keyof PageSpeedMetrics,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<keyof PageSpeedMetrics, [number, number]> = {
    lcp: [2500, 4000], // Good < 2.5s, Needs improvement > 4s
    fcp: [1800, 3000], // Good < 1.8s, Needs improvement > 3s
    cls: [0.1, 0.25], // Good < 0.1, Needs improvement > 0.25
    fid: [100, 300], // Good < 100ms, Needs improvement > 300ms
    ttfb: [600, 1800], // Good < 600ms, Needs improvement > 1.8s
    tti: [3800, 7300], // Good < 3.8s, Needs improvement > 7.3s
  };

  const [good, needsImprovement] = thresholds[metric];

  if (value <= good) return 'good';
  if (value <= needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Format metric for display
 */
export function formatMetric(
  metric: keyof PageSpeedMetrics,
  value: number
): string {
  if (metric === 'cls') {
    return value.toFixed(3);
  }
  return `${Math.round(value)}ms`;
}

/**
 * Calculate improvement potential
 */
export function calculatePageSpeedImprovement(
  current: PageSpeedAnalysis,
  target: number = 90
): number {
  const avgCurrent = current.avgScore;
  const improvement = Math.max(0, target - avgCurrent);
  return Math.round((improvement / target) * 100);
}
