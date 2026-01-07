/**
 * AIV Score Calculator
 * AI Visibility Score formula and related calculations
 */

export interface AIVScoreInput {
  isVisible: boolean;
  position: number; // 1-based ranking (1 is best)
  totalResults: number;
  competitorsScore: number; // 0-100
}

export interface AIVScoreResult {
  score: number;
  components: {
    visibility: number; // 0-1
    position: number; // 0-1
    competitive: number; // 0-1
  };
  breakdown: {
    visibilityComponent: number; // V × (V×100×0.30)
    positionComponent: number; // P×0.25
    competitiveComponent: number; // C×0.20
  };
}

/**
 * Calculate AIV Score (AI Visibility Score)
 * 
 * Formula: AIV = V × (V×100×0.30) + (P×0.25) + (C×0.20)
 * 
 * Where:
 *   V = Visibility (1 if visible, 0 if not)
 *   P = Position Score (0-1, normalized from position rank)
 *   C = Competitive Score (0-1, normalized from 0-100)
 * 
 * @param input - Input parameters for calculation
 * @returns AIV Score with breakdown
 * 
 * @example
 * const score = calculateAIVScore({
 *   isVisible: true,
 *   position: 1,
 *   totalResults: 100,
 *   competitorsScore: 70
 * });
 * // Returns: { score: 28.5, components: {...}, breakdown: {...} }
 */
export function calculateAIVScore(input: AIVScoreInput): AIVScoreResult {
  // V = Visibility (1 if visible, 0 if not)
  const visibility = input.isVisible ? 1 : 0;

  // P = Position score: normalize position to 0-1 scale
  // Position 1 = 1.0, Position 10 = 0.0, Position 20+ = 0.0
  const maxPosition = Math.min(10, input.totalResults);
  const positionScore = visibility > 0 ? Math.max(0, (maxPosition - input.position) / (maxPosition - 1)) : 0;

  // C = Competitive score: normalize 0-100 to 0-1
  const competitiveScore = Math.max(0, Math.min(1, input.competitorsScore / 100));

  // Calculate components
  const visibilityComponent = visibility * (visibility * 100 * 0.3);
  const positionComponent = positionScore * 0.25;
  const competitiveComponent = competitiveScore * 0.2;

  // Calculate total AIV Score
  const score = visibilityComponent + positionComponent + competitiveComponent;

  // Round to 2 decimal places
  const roundedScore = Math.round(score * 100) / 100;

  return {
    score: roundedScore,
    components: {
      visibility,
      position: positionScore,
      competitive: competitiveScore,
    },
    breakdown: {
      visibilityComponent: Math.round(visibilityComponent * 100) / 100,
      positionComponent: Math.round(positionComponent * 100) / 100,
      competitiveComponent: Math.round(competitiveComponent * 100) / 100,
    },
  };
}

/**
 * Calculate AIV Score from service metrics (simplified version)
 * 
 * Used when we have aggregated service metrics
 * 
 * @param visibility - Visibility percentage (0-100)
 * @param position - Average position rank (1+)
 * @param competitorsScore - Competitor strength (0-100)
 * @returns AIV Score
 */
export function calculateAIVScoreSimplified(
  visibility: number,
  position: number,
  competitorsScore: number,
): number {
  const result = calculateAIVScore({
    isVisible: visibility > 0,
    position: Math.max(1, position),
    totalResults: 10,
    competitorsScore,
  });

  return result.score;
}

/**
 * Get AIV Score badge color/variant
 * 
 * @param score - AIV Score (0-100)
 * @returns Color variant: 'success', 'warning', or 'outline'
 */
export function getAIVBadgeVariant(score: number): 'success' | 'warning' | 'outline' {
  if (score >= 25) return 'success'; // Good: 25+
  if (score >= 15) return 'warning'; // Medium: 15-25
  return 'outline'; // Poor: <15
}

/**
 * Get AIV Score rating text
 * 
 * @param score - AIV Score
 * @returns Human-readable rating
 */
export function getAIVRating(score: number): string {
  if (score >= 30) return 'Excellent';
  if (score >= 20) return 'Good';
  if (score >= 10) return 'Fair';
  if (score >= 5) return 'Poor';
  return 'Very Poor';
}

/**
 * Calculate potential AIV Score improvement
 * 
 * Shows what the score would be if position was improved
 * 
 * @param input - Current input
 * @param targetPosition - Target position to achieve
 * @returns Potential score and improvement
 */
export function calculateAIVImprovement(
  input: AIVScoreInput,
  targetPosition: number,
): {
  currentScore: number;
  potentialScore: number;
  improvement: number;
  improvementPercent: number;
} {
  const current = calculateAIVScore(input);
  const potential = calculateAIVScore({
    ...input,
    position: targetPosition,
  });

  const improvement = potential.score - current.score;
  const improvementPercent = Math.round((improvement / current.score) * 100);

  return {
    currentScore: current.score,
    potentialScore: potential.score,
    improvement,
    improvementPercent,
  };
}

/**
 * Bulk calculate AIV scores for services
 * 
 * @param services - Array of service metrics
 * @returns Array of scores with metadata
 */
export function calculateBulkAIVScores(
  services: Array<{
    id: string;
    isVisible: boolean;
    position: number;
    totalResults: number;
    competitorsScore: number;
  }>,
): Array<{
  id: string;
  aivScore: number;
  rating: string;
  variant: 'success' | 'warning' | 'outline';
}> {
  return services.map((service) => {
    const result = calculateAIVScore(service);
    return {
      id: service.id,
      aivScore: result.score,
      rating: getAIVRating(result.score),
      variant: getAIVBadgeVariant(result.score),
    };
  });
}

/**
 * Get position recommendation to reach target AIV score
 * 
 * @param currentInput - Current service metrics
 * @param targetAIVScore - Target AIV Score to achieve
 * @returns Required position to reach target, or null if impossible
 */
export function getPositionRecommendation(
  currentInput: AIVScoreInput,
  targetAIVScore: number,
): number | null {
  // If not visible, can't reach high scores
  if (!currentInput.isVisible && targetAIVScore > 10) {
    return null;
  }

  // Binary search for the best position
  let bestPosition = currentInput.position;
  let bestScore = calculateAIVScore(currentInput).score;

  // Try improving position incrementally
  for (let pos = 1; pos < currentInput.position; pos++) {
    const score = calculateAIVScore({
      ...currentInput,
      position: pos,
    }).score;

    if (score >= targetAIVScore) {
      return pos;
    }

    if (score > bestScore) {
      bestScore = score;
      bestPosition = pos;
    }
  }

  // If target achievable at current best, return it
  if (bestScore >= targetAIVScore) {
    return bestPosition;
  }

  return null;
}

/**
 * Compare AIV scores between services
 * 
 * @param service1 - First service metrics
 * @param service2 - Second service metrics
 * @returns Comparison object
 */
export function compareAIVScores(
  service1: AIVScoreInput,
  service2: AIVScoreInput,
): {
  service1Score: number;
  service2Score: number;
  difference: number;
  winner: 'service1' | 'service2' | 'tie';
} {
  const score1 = calculateAIVScore(service1).score;
  const score2 = calculateAIVScore(service2).score;
  const difference = score1 - score2;

  let winner: 'service1' | 'service2' | 'tie';
  if (Math.abs(difference) < 0.01) {
    winner = 'tie';
  } else if (difference > 0) {
    winner = 'service1';
  } else {
    winner = 'service2';
  }

  return {
    service1Score: Math.round(score1 * 100) / 100,
    service2Score: Math.round(score2 * 100) / 100,
    difference: Math.round(difference * 100) / 100,
    winner,
  };
}
