import type { DashboardData } from '~/components/dashboard/DashboardView';
import type { TechAuditResult } from '~/lib/modules/audit/live-scanner';

/**
 * TrendPoint - Single data point in the trend chart
 */
export interface TrendPoint {
  date: string;
  score: number;
}

/**
 * ScanResult - Result of a live scan for simulation/playground
 */
export interface ScanResult {
  visible: boolean;
  position: number | null; // 1-10, null if not found
  competitors: string[]; // List of competitor domain names
  calculatedScore?: number; // Pre-calculated ClinicAI score (optional)
  trustScore?: number; // 1-10, E-E-A-T trust score from AI analysis
  localScore?: number; // 1-10, Local score from AI analysis
  // If calculatedScore is not provided, we'll calculate it based on visibility and position
}

/**
 * Generate simulated history data for trend chart
 * 
 * Creates 6 data points (weeks) with the last point being the finalScore.
 * Previous points are generated to show realistic organic growth trending up to the final score.
 * 
 * Algorithm:
 * - Start at finalScore - random(10, 20) for the first point
 * - Iterate forward, adding random small increments or decrements, generally trending up
 * - Use simple "Week -5", "Week -4", etc. labels for dates (formatted as ISO dates for chart compatibility)
 * 
 * @param finalScore - The final ClinicAI score (0-100) to end the trend at
 * @returns Array of 6 TrendPoint objects with dates and scores
 */
export function generateSimulatedHistory(finalScore: number): TrendPoint[] {
  // Ensure finalScore is within valid range
  const score = Math.max(0, Math.min(100, finalScore));

  // Generate 6 points (Week -5 to Week 0 / Today)
  const points: TrendPoint[] = [];

  // Start at finalScore - random(10, 20) for the first point
  const randomOffset = 10 + Math.random() * 10; // Random between 10 and 20
  const initialScore = Math.max(0, score - randomOffset);

  // Generate dates for the last 6 weeks (Week -5 to Week 0 / Today)
  const today = new Date();
  const dates: string[] = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - (i * 7)); // Go back i weeks
    dates.push(date.toISOString().split('T')[0] || '');
  }

  // Generate scores for weeks -5 to -1 (first 5 points)
  let currentScore = initialScore;

  for (let i = 0; i < 5; i++) {
    // Calculate target progress: we want to reach finalScore by the last point
    // So we need to progress from initialScore to finalScore over 6 points
    const progress = (i + 1) / 6; // 0.167, 0.333, 0.5, 0.667, 0.833
    const targetScore = initialScore + (score - initialScore) * progress;

    // Add some randomness: small increments or decrements, but generally trending up
    // Random value between -2 and +4 (bias towards positive for growth)
    const randomChange = -2 + Math.random() * 6;
    currentScore = targetScore + randomChange;

    // Ensure score stays within bounds and doesn't exceed finalScore too much
    currentScore = Math.max(0, Math.min(score + 5, currentScore));

    // Ensure we're generally trending up (current should be >= previous - 3)
    // Allow small dips but maintain overall upward trend
    if (i > 0 && currentScore < points[i - 1]!.score - 3) {
      currentScore = points[i - 1]!.score - 2; // Small dip allowed, but not too much
    }

    // Ensure we don't exceed the final score too early
    if (currentScore > score + 2) {
      currentScore = score - (5 - i) * 2; // Gradually approach final score
    }

    points.push({
      date: dates[i] || '',
      score: Math.round(currentScore * 10) / 10, // Round to 1 decimal
    });
  }

  // Add the final point (Today / Week 0) with exact finalScore
  points.push({
    date: dates[5] || today.toISOString().split('T')[0] || '',
    score: Math.round(score * 10) / 10,
  });

  return points;
}

/**
 * Calculate ClinicAI Score for Playground using real-time data
 * 
 * Formula:
 * - Visibility (25%): 100 if visible, 0 if not
 * - Tech (20%): Based on TTFB (<600ms = 100, >1500ms = 20) and SSL
 * - Content (20%): 100 if llms.txt exists, 0 if not
 * - E-E-A-T (15%): trustScore scaled to 0-100
 * - Local (10%): localScore scaled to 0-100
 * - Other (10%): Constant 50
 */
function calculatePlaygroundClinicAIScore(
  visible: boolean,
  techAudit: TechAuditResult,
  trustScore: number, // 1-10
  localScore: number, // 1-10
): number {
  // Visibility (25%): 100 if visible, 0 if not
  const visibilityScore = visible ? 100 : 0;

  // Tech (20%): Based on TTFB and SSL
  // TTFB: <600ms = 100, 600-1500ms = linear interpolation, >1500ms = 20
  const ttfbMs = techAudit.performance.ttfbMs;
  let ttfbScore: number;
  if (ttfbMs < 600) {
    ttfbScore = 100;
  } else if (ttfbMs > 1500) {
    ttfbScore = 20;
  } else {
    // Linear interpolation between 600ms (100) and 1500ms (20)
    ttfbScore = 100 - ((ttfbMs - 600) / (1500 - 600)) * (100 - 20);
  }

  // SSL: Has SSL = 100, No SSL = 0
  const sslScore = techAudit.metadata.hasSsl ? 100 : 0;

  // Tech score is average of TTFB and SSL
  const techScore = (ttfbScore + sslScore) / 2;

  // Content (20%): 100 if llms.txt exists, 0 if not
  const contentScore = techAudit.llmsTxt.exists ? 100 : 0;

  // E-E-A-T (15%): trustScore scaled from 1-10 to 0-100
  const eeatScore = trustScore * 10;

  // Local (10%): localScore scaled from 1-10 to 0-100
  const localScoreScaled = localScore * 10;

  // Other (10%): Constant 50
  const otherScore = 50;

  // Calculate weighted score
  const score =
    0.25 * visibilityScore +
    0.2 * techScore +
    0.2 * contentScore +
    0.15 * eeatScore +
    0.1 * localScoreScaled +
    0.1 * otherScore;

  // Round to 2 decimal places and ensure within bounds
  return Math.max(0, Math.min(100, Math.round(score * 100) / 100));
}

/**
 * Map a live scan result to DashboardData format for playground visualization
 * 
 * This function simulates dashboard data from a single scan result,
 * useful for "Playground" mode where users can test queries before committing.
 * 
 * @param scanResult - The result of a single scan (includes trustScore and localScore)
 * @param domain - The user's domain to mark as current project
 * @param techAudit - Tech audit results from live crawler (required for accurate score calculation)
 * @returns DashboardData formatted for DashboardView component
 */
export function mapLiveScanToDashboard(
  scanResult: ScanResult,
  domain: string,
  techAudit: TechAuditResult,
): DashboardData {
  const { visible, position, competitors, trustScore = 0, localScore = 0 } = scanResult;

  // Calculate ClinicAI Score using refined formula with real-time data
  // If calculatedScore is provided, use it; otherwise calculate using real data
  let score: number;
  if (scanResult.calculatedScore !== undefined) {
    score = scanResult.calculatedScore;
  } else {
    // Use refined calculation with real tech audit and E-E-A-T/Local scores
    score = calculatePlaygroundClinicAIScore(visible, techAudit, trustScore, localScore);
  }

  // Ensure score is within 0-100 range
  score = Math.max(0, Math.min(100, score));

  // Calculate KPIs
  const visibility = visible ? 100 : 0; // 100% if found, 0% if not
  const avgPosition = position && position > 0 ? position : null;
  const _trackedServices = 1; // Single test scan

  // If tech audit data is available, we can show additional insights in the UI
  // For now, the score already incorporates tech data from calculateImprovedClinicAIScore

  // Generate simulated history with 6 data points showing organic growth
  const trend = generateSimulatedHistory(score);

  // Map competitors to scatter plot format
  const competitorPoints: Array<{
    name: string;
    x: number;
    y: number;
    isCurrent: boolean;
    z?: number;
  }> = [];

  // Add user's domain as current project point
  if (visible && position) {
    competitorPoints.push({
      name: domain,
      x: position,
      y: score,
      isCurrent: true,
      z: 1, // Single mention
    });
  }

  // Add competitors with simulated scores based on their rank
  // Since we don't know their real positions from a single scan,
  // we assign them sequential positions and simulate their AI Score
  competitors.forEach((competitorDomain, index) => {
    // Skip if it's the user's domain (already added)
    if (competitorDomain.toLowerCase() === domain.toLowerCase()) {
      return;
    }

    // Assign position based on order in competitors list
    // First competitor gets position 1, second gets 2, etc.
    // If user is visible, we need to account for their position
    let competitorPosition: number;
    if (visible && position) {
      // User is visible at position N
      // Competitors are assigned positions, avoiding the user's position
      competitorPosition = index + 1;
      // If we've reached or passed the user's position, shift by 1
      if (competitorPosition >= position) {
        competitorPosition = competitorPosition + 1;
      }
    } else {
      // User not visible, competitors take positions 1, 2, 3...
      competitorPosition = index + 1;
    }

    // Simulate AI Score based on rank (position)
    // Rank 1 = Score 90, Rank 2 = Score 80, Rank 3 = Score 70, Rank 5 = Score 50, etc.
    // Formula: Score = 90 - (position - 1) * 10, with minimum of 20
    // This matches the requirement: Rank 1 = 90, Rank 5 = 50
    const simulatedScore = Math.max(20, 90 - (competitorPosition - 1) * 10);

    // Simulate number of services for bubble size (z)
    // Range from 5 to 50 services
    const simulatedServices = Math.floor(5 + Math.random() * 45);

    competitorPoints.push({
      name: competitorDomain,
      x: competitorPosition,
      y: simulatedScore,
      isCurrent: false,
      z: simulatedServices,
    });
  });

  // Sort competitors by position (x-axis) for better visualization
  competitorPoints.sort((a, b) => (a.x || 0) - (b.x || 0));

  // Calculate component scores for breakdown metrics (0-100 scale)
  // Tech Optimization: Based on TTFB and SSL
  const ttfbMs = techAudit.performance.ttfbMs;
  let ttfbScore: number;
  if (ttfbMs < 600) {
    ttfbScore = 100;
  } else if (ttfbMs > 1500) {
    ttfbScore = 20;
  } else {
    ttfbScore = 100 - ((ttfbMs - 600) / (1500 - 600)) * 80;
  }
  const sslScore = techAudit.metadata.hasSsl ? 100 : 0;
  const techOptimizationValue = (ttfbScore + sslScore) / 2;

  // Content Optimization: Based on llms.txt existence
  const contentOptimizationValue = techAudit.llmsTxt.exists ? 100 : 50;

  // E-E-A-T Signal: trustScore is 1-10, scale to 10-100
  const eeatSignalValue = trustScore * 10;

  // Local Signal: localScore is 1-10, scale to 10-100
  const localSignalValue = localScore * 10;

  return {
    metrics: {
      clinicAiScore: { value: score, trend: 0 },
      serviceVisibility: { value: visibility, trend: 0 },
      avgPosition: { value: avgPosition ?? 0, trend: 0 },
      techOptimization: { value: techOptimizationValue, trend: 0 },
      contentOptimization: { value: contentOptimizationValue, trend: 0 },
      eeatSignal: { value: eeatSignalValue, trend: 0 },
      localSignal: { value: localSignalValue, trend: 0 },
    },
    trend,
    competitors: competitorPoints,
  };
}

