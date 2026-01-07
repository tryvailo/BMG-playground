/**
 * Metrics Calculator for Dashboard
 * Implements ClinicAI Score formula and related calculations
 */

export interface ClinicAIScoreComponents {
  visibility: number; // 0-100
  techOptimization: number; // 0-100
  contentOptimization: number; // 0-100
  eeatSignals: number; // 0-100
  localSignals: number; // 0-100
  performanceScore?: number; // 0-100 (optional)
}

export interface ClinicAIScoreResult {
  score: number;
  components: {
    visibility: number;
    techOptimization: number;
    contentOptimization: number;
    eeatSignals: number;
    localSignals: number;
  };
  weights: {
    visibility: number;
    techOptimization: number;
    contentOptimization: number;
    eeatSignals: number;
    localSignals: number;
  };
}

/**
 * Calculates ClinicAI Score from component scores
 * 
 * Formula: 
 * ClinicAI Score = 0.25×Visibility + 0.2×Tech + 0.2×Content + 0.15×E-E-A-T + 0.1×Local
 * 
 * @param components - Component scores (0-100)
 * @returns ClinicAI Score (0-100)
 * 
 * @example
 * const score = calculateClinicAIScore({
 *   visibility: 75,
 *   techOptimization: 80,
 *   contentOptimization: 70,
 *   eeatSignals: 85,
 *   localSignals: 60
 * });
 * // Result: 74.5
 */
export function calculateClinicAIScore(components: ClinicAIScoreComponents): ClinicAIScoreResult {
  // Ensure all values are between 0-100
  const normalizeScore = (value: number): number => {
    return Math.max(0, Math.min(100, value || 0));
  };

  const normalizedComponents = {
    visibility: normalizeScore(components.visibility),
    techOptimization: normalizeScore(components.techOptimization),
    contentOptimization: normalizeScore(components.contentOptimization),
    eeatSignals: normalizeScore(components.eeatSignals),
    localSignals: normalizeScore(components.localSignals),
  };

  // Apply weights
  const weights = {
    visibility: 0.25,
    techOptimization: 0.2,
    contentOptimization: 0.2,
    eeatSignals: 0.15,
    localSignals: 0.1,
  };

  const score =
    normalizedComponents.visibility * weights.visibility +
    normalizedComponents.techOptimization * weights.techOptimization +
    normalizedComponents.contentOptimization * weights.contentOptimization +
    normalizedComponents.eeatSignals * weights.eeatSignals +
    normalizedComponents.localSignals * weights.localSignals;

  // Round to 2 decimal places
  const roundedScore = Math.round(score * 100) / 100;

  return {
    score: roundedScore,
    components: normalizedComponents,
    weights,
  };
}

/**
 * Calculates score badge color based on score value
 * @param score - Score value (0-100)
 * @returns Color variant: 'success', 'warning', or 'outline'
 */
export function getScoreBadgeVariant(score: number): 'success' | 'warning' | 'outline' {
  if (score >= 70) return 'success';
  if (score >= 40) return 'warning';
  return 'outline';
}

/**
 * Calculates trend arrow and color based on change
 * @param currentValue - Current metric value
 * @param previousValue - Previous metric value
 * @param isInverseMetric - Whether lower is better (e.g., position)
 * @returns Object with trend indicator and color
 */
export function calculateTrend(
  currentValue: number,
  previousValue: number,
  isInverseMetric: boolean = false
): { arrow: 'up' | 'down' | 'stable'; color: 'success' | 'danger' | 'default'; change: number } {
  const change = currentValue - previousValue;
  const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;

  let arrow: 'up' | 'down' | 'stable';
  let color: 'success' | 'danger' | 'default';

  if (Math.abs(changePercent) < 0.1) {
    arrow = 'stable';
    color = 'default';
  } else if (change > 0) {
    arrow = 'up';
    color = isInverseMetric ? 'danger' : 'success'; // For inverse metrics, up = bad
  } else {
    arrow = 'down';
    color = isInverseMetric ? 'success' : 'danger'; // For inverse metrics, down = good
  }

  return {
    arrow,
    color,
    change: Math.round(changePercent * 100) / 100,
  };
}

/**
 * Formats score for display with trailing zeros
 * @param score - Score value
 * @param decimals - Number of decimal places
 * @returns Formatted score string
 */
export function formatScore(score: number, decimals: number = 1): string {
  return score.toFixed(decimals);
}

/**
 * Calculates average position score based on position rank
 * Lower position = higher score
 * Position 1 = 100 points
 * Position 10+ = 0 points
 * 
 * @param position - Average search position (1-based)
 * @returns Score 0-100
 */
export function calculatePositionScore(position: number): number {
  if (!position || position < 1) return 0;
  if (position <= 1) return 100;
  if (position >= 10) return 0;

  // Linear interpolation: position 1-10 -> score 100-0
  return Math.round(((10 - position) / 9) * 100 * 100) / 100;
}

/**
 * Calculates visibility score based on visible keywords count
 * @param visibleCount - Number of visible keywords
 * @param totalCount - Total number of tracked keywords
 * @returns Score 0-100
 */
export function calculateVisibilityScore(visibleCount: number, totalCount: number): number {
  if (!totalCount || totalCount === 0) return 0;
  return Math.round((visibleCount / totalCount) * 100 * 100) / 100;
}

/**
 * AIV Score (AI Visibility) Formula
 * AIV Score = V × (V×100×0.30) + (P×0.25) + (C×0.20)
 * Where:
 * - V = Visibility (0-1)
 * - P = Position Score (0-1)
 * - C = Competitive Score (0-1)
 */
export interface AIVScoreInput {
  isVisible: boolean;
  position: number;
  totalResults: number;
  competitorsScore: number; // 0-100
}

export function calculateAIVScore(input: AIVScoreInput): number {
  // V = Visibility (1 if visible, 0 if not)
  const visibility = input.isVisible ? 1 : 0;

  // Position score: normalize to 0-1 (position 1 = 1, position 10+ = 0)
  const positionScore = Math.max(0, Math.min(1, (10 - input.position) / 9));

  // Competitive score: normalize 0-100 to 0-1
  const competitiveScore = Math.max(0, Math.min(1, input.competitorsScore / 100));

  // Calculate AIV Score
  const aivScore =
    visibility * (visibility * 100 * 0.3) + positionScore * 0.25 + competitiveScore * 0.2;

  return Math.round(aivScore * 100) / 100;
}

/**
 * Calculates dashboard KPI metrics from raw data
 */
export interface DashboardMetrics {
  avgAIVScore: {
    value: number;
    change: number;
    isPositive: boolean;
  };
  visibleKeywords: {
    value: number;
    change: number;
    isPositive: boolean;
  };
  avgPosition: {
    value: number;
    change: number;
    isPositive: boolean;
  };
  competitorGap: {
    value: number;
    change: number;
    isPositive: boolean;
  };
  clinicAIScore: {
    value: number;
    change: number;
    isPositive: boolean;
  };
}

export interface RawDashboardData {
  services: Array<{
    id: string;
    name: string;
    visibility: number;
    avgPosition: number;
    aivScore: number;
  }>;
  previousServices?: Array<{
    id: string;
    name: string;
    visibility: number;
    avgPosition: number;
    aivScore: number;
  }>;
  techScore: number;
  contentScore: number;
  eeatScore: number;
  localScore: number;
}

/**
 * Calculates all dashboard KPI metrics from raw service data
 */
export function calculateDashboardMetrics(data: RawDashboardData): DashboardMetrics {
  // Calculate average AIV Score
  const currentAvgAIV =
    data.services.length > 0
      ? data.services.reduce((sum, s) => sum + (s.aivScore || 0), 0) / data.services.length
      : 0;

  const previousAvgAIV =
    data.previousServices && data.previousServices.length > 0
      ? data.previousServices.reduce((sum, s) => sum + (s.aivScore || 0), 0) / data.previousServices.length
      : currentAvgAIV;

  // Calculate visible keywords count
  const currentVisibleCount = data.services.filter((s) => s.visibility > 0).length;
  const previousVisibleCount =
    data.previousServices?.filter((s) => s.visibility > 0).length || currentVisibleCount;

  // Calculate average position
  const currentAvgPosition =
    data.services.length > 0
      ? data.services.reduce((sum, s) => sum + (s.avgPosition || 0), 0) / data.services.length
      : 0;

  const previousAvgPosition =
    data.previousServices && data.previousServices.length > 0
      ? data.previousServices.reduce((sum, s) => sum + (s.avgPosition || 0), 0) / data.previousServices.length
      : currentAvgPosition;

  // Calculate competitor gap (simplified)
  const competitorGapCurrent = Math.max(0, 100 - currentAvgAIV);
  const competitorGapPrevious = Math.max(0, 100 - previousAvgAIV);

  // Calculate ClinicAI Score
  const clinicAIScoreResult = calculateClinicAIScore({
    visibility: currentVisibleCount * (100 / Math.max(1, data.services.length)),
    techOptimization: data.techScore,
    contentOptimization: data.contentScore,
    eeatSignals: data.eeatScore,
    localSignals: data.localScore,
  });

  return {
    avgAIVScore: {
      value: Math.round(currentAvgAIV * 100) / 100,
      change: Math.round((currentAvgAIV - previousAvgAIV) * 100) / 100,
      isPositive: currentAvgAIV >= previousAvgAIV,
    },
    visibleKeywords: {
      value: currentVisibleCount,
      change: currentVisibleCount - previousVisibleCount,
      isPositive: currentVisibleCount >= previousVisibleCount,
    },
    avgPosition: {
      value: Math.round(currentAvgPosition * 100) / 100,
      change: Math.round((previousAvgPosition - currentAvgPosition) * 100) / 100, // Inverted
      isPositive: currentAvgPosition <= previousAvgPosition, // Lower is better
    },
    competitorGap: {
      value: Math.round(competitorGapCurrent * 100) / 100,
      change: Math.round((competitorGapPrevious - competitorGapCurrent) * 100) / 100,
      isPositive: competitorGapCurrent <= competitorGapPrevious,
    },
    clinicAIScore: {
      value: clinicAIScoreResult.score,
      change: 0, // To be calculated with history
      isPositive: true,
    },
  };
}
