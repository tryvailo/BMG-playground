import type { Scan, CompetitorPoint } from '~/lib/types/domain';

/*
 * -------------------------------------------------------
 * Clinic AI Score Calculator
 * -------------------------------------------------------
 */

export interface ClinicAIScoreInputs {
  visibility: number; // 0-100
  tech: number; // 0-100
  content: number; // 0-100
  eeat: number; // 0-100 (Experience, Expertise, Authoritativeness, Trustworthiness)
  local: number; // 0-100
}

/**
 * Calculate Clinic AI Score using weighted formula
 * Formula: 0.25*Visibility + 0.2*Tech + 0.2*Content + 0.15*EEAT + 0.1*Local
 * 
 * @param inputs - Object containing all score components (0-100 each)
 * @returns Clinic AI Score as float (0-100)
 */
export function calculateClinicAIScore(
  inputs: ClinicAIScoreInputs,
): number {
  const { visibility, tech, content, eeat, local } = inputs;

  // Validate inputs are within 0-100 range
  const validateScore = (score: number, name: string) => {
    if (score < 0 || score > 100) {
      throw new Error(`${name} score must be between 0 and 100, got ${score}`);
    }
  };

  validateScore(visibility, 'Visibility');
  validateScore(tech, 'Tech');
  validateScore(content, 'Content');
  validateScore(eeat, 'EEAT');
  validateScore(local, 'Local');

  // Calculate weighted score
  const score =
    0.25 * visibility +
    0.2 * tech +
    0.2 * content +
    0.15 * eeat +
    0.1 * local;

  // Round to 2 decimal places and ensure it's within bounds
  return Math.max(0, Math.min(100, Math.round(score * 100) / 100));
}

/*
 * -------------------------------------------------------
 * Visibility Rate Calculator
 * -------------------------------------------------------
 */

/**
 * Calculate visibility rate as percentage
 * Formula: (visible / total) * 100
 * 
 * @param totalServices - Total number of services tracked
 * @param visibleServices - Number of services that are visible in AI responses
 * @returns Visibility rate as percentage (0-100)
 */
export function calculateVisibilityRate(
  totalServices: number,
  visibleServices: number,
): number {
  if (totalServices < 0) {
    throw new Error('Total services must be non-negative');
  }

  if (visibleServices < 0) {
    throw new Error('Visible services must be non-negative');
  }

  if (visibleServices > totalServices) {
    throw new Error(
      'Visible services cannot exceed total services',
    );
  }

  if (totalServices === 0) {
    return 0;
  }

  const rate = (visibleServices / totalServices) * 100;

  // Round to 2 decimal places
  return Math.round(rate * 100) / 100;
}

/*
 * -------------------------------------------------------
 * Competitor Statistics Aggregator
 * -------------------------------------------------------
 */

interface DomainStats {
  domain: string;
  appearances: number;
  positions: number[];
  totalScans: number;
}

/**
 * Extract domain from raw response text
 * This is a basic implementation - you may need to enhance it based on
 * the actual format of AI responses in your system.
 * 
 * @param rawResponse - Raw AI response text
 * @returns Array of extracted domains
 */
function extractDomainsFromResponse(rawResponse: string | null): string[] {
  if (!rawResponse) {
    return [];
  }

  // Basic domain regex pattern
  // Matches domains like: example.com, www.example.com, subdomain.example.com
  const domainRegex =
    /(?:https?:\/\/)?(?:www\.)?([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,})/gi;

  const matches = rawResponse.matchAll(domainRegex);
  const domains = new Set<string>();

  for (const match of matches) {
    const domain = match[1]?.toLowerCase();
    if (domain && !domain.includes('localhost') && !domain.includes('127.0.0.1')) {
      domains.add(domain);
    }
  }

  return Array.from(domains);
}

/**
 * Aggregate competitor statistics from scan results
 * 
 * Logic:
 * - Extract all domains mentioned in scan results
 * - Count frequency (appearances)
 * - Calculate average position per domain
 * - Return top 9 domains for the Scatter Plot
 * 
 * @param scans - Array of scan results
 * @param clientDomain - Optional domain to mark as client's own domain
 * @returns Array of CompetitorPoint objects (top 9 domains)
 */
export function aggregateCompetitorStats(
  scans: Scan[],
  clientDomain?: string,
): CompetitorPoint[] {
  if (scans.length === 0) {
    return [];
  }

  // Sort scans by date to split them for trend calculation
  const sortedScans = [...scans].sort((a, b) =>
    new Date(a.analyzed_at).getTime() - new Date(b.analyzed_at).getTime()
  );

  const midpoint = Math.floor(sortedScans.length / 2);
  const previousScans = sortedScans.slice(0, midpoint);
  const currentScans = sortedScans.slice(midpoint);

  // Function to calculate stats for a set of scans
  const getStats = (scanSet: Scan[]) => {
    const domainStatsMap = new Map<string, DomainStats & { totalScansCount: number }>();

    for (const scan of scanSet) {
      const domains = extractDomainsFromResponse(scan.raw_response);
      if (domains.length === 0 && scan.visible && clientDomain) {
        // Fallback if client domain is visible but not explicitly in text (unlikely but possible)
        domains.push(clientDomain);
      }

      for (const domain of domains) {
        if (!domainStatsMap.has(domain)) {
          domainStatsMap.set(domain, {
            domain,
            appearances: 0,
            positions: [],
            totalScans: 0,
            totalScansCount: 0
          });
        }
        const stats = domainStatsMap.get(domain)!;
        stats.appearances += 1;
        if (scan.visible && scan.position !== null) {
          stats.positions.push(scan.position);
        }
      }

      // Track total scans to calculate visibility rate correctly
      // This is tricky because we need to know how many scans this domain COULD have appeared in.
      // For now, we use the total number of scans in the set as the denominator.
    }

    return domainStatsMap;
  };

  const currentStatsMap = getStats(currentScans);
  const previousStatsMap = getStats(previousScans);

  // Combine and calculate final points
  const denomCurrent = Math.max(1, currentScans.length);
  const denomPrevious = Math.max(1, previousScans.length);

  const competitorPoints: CompetitorPoint[] = Array.from(currentStatsMap.values()).map((stats) => {
    const avgPosition = stats.positions.length > 0
      ? stats.positions.reduce((sum, pos) => sum + pos, 0) / stats.positions.length
      : null;

    const visibilityRate = (stats.appearances / denomCurrent) * 100;
    const positionScore = avgPosition ? Math.max(0, 100 - avgPosition * 10) : 0;
    const aiScore = (visibilityRate * 0.6 + positionScore * 0.4);

    // Trend calculation
    let trend = 0;
    const prev = previousStatsMap.get(stats.domain);
    if (prev) {
      const prevAvgPos = prev.positions.length > 0
        ? prev.positions.reduce((sum, pos) => sum + pos, 0) / prev.positions.length
        : null;
      const prevVisibility = (prev.appearances / denomPrevious) * 100;
      const prevPosScore = prevAvgPos ? Math.max(0, 100 - prevAvgPos * 10) : 0;
      const prevAiScore = (prevVisibility * 0.6 + prevPosScore * 0.4);

      if (prevAiScore > 0) {
        trend = ((aiScore - prevAiScore) / prevAiScore) * 100;
      } else if (aiScore > 0) {
        trend = 100; // New competitor appeared
      }
    }

    return {
      domain: stats.domain,
      avgPosition: avgPosition ? Math.round(avgPosition * 10) / 10 : null,
      aiScore: Math.round(aiScore * 10) / 10,
      isClient: clientDomain ? stats.domain.toLowerCase() === clientDomain.toLowerCase() : false,
      mentions: stats.appearances,
      visibility: Math.round(visibilityRate * 10) / 10,
      trend: Math.round(trend * 10) / 10
    };
  });

  // Take top 10 domains by AI score or appearances
  return competitorPoints
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 10);
}

/*
 * -------------------------------------------------------
 * Helper Functions
 * -------------------------------------------------------
 */

/**
 * Calculate average position from visible scans
 * 
 * @param scans - Array of scan results
 * @returns Average position or null if no visible scans
 */
export function calculateAveragePosition(scans: Scan[]): number | null {
  const visibleScans = scans.filter(
    (scan) => scan.visible && scan.position !== null,
  );

  if (visibleScans.length === 0) {
    return null;
  }

  const sum = visibleScans.reduce(
    (acc, scan) => acc + (scan.position ?? 0),
    0,
  );

  return Math.round((sum / visibleScans.length) * 10) / 10;
}

/**
 * Count visible services from scans
 * 
 * @param scans - Array of scan results
 * @returns Number of unique services that are visible
 */
export function countVisibleServices(scans: Scan[]): number {
  const visibleServiceIds = new Set<string>();

  for (const scan of scans) {
    if (scan.visible) {
      visibleServiceIds.add(scan.service_id);
    }
  }

  return visibleServiceIds.size;
}

/**
 * Count total unique services from scans
 * 
 * @param scans - Array of scan results
 * @returns Total number of unique services
 */
export function countTotalServices(scans: Scan[]): number {
  const serviceIds = new Set<string>();

  for (const scan of scans) {
    serviceIds.add(scan.service_id);
  }

  return serviceIds.size;
}

/*
 * -------------------------------------------------------
 * Service AIV Score Calculator
 * -------------------------------------------------------
 */

export interface ServiceAivScoreInputs {
  isVisible: boolean; // Is the service found in AI response? (V)
  position: number | null; // The rank of the service (1, 2, 3...). (P)
  totalResults: number; // Total items found in the list
  competitorsAvgScore: number; // Average ClinicAI score of competitors found (0-100). (C)
}

export interface ServiceAivScoreBreakdown {
  visibilityPart: number; // V * 100 * 0.30
  positionPart: number; // P_Score * 0.25
  competitorPart: number; // C * 0.20
  finalScore: number; // Final AIV Score
}

/**
 * Calculate Service AIV Score using the formula from Technical Specification (Section 2)
 * 
 * Formula: AIV Score = V * ((V * 100 * 0.30) + (P_Score * 0.25) + (C * 0.20))
 * 
 * Where:
 * - V (Visibility): 1 if visible, 0 if not
 * - P_Score (Position Component):
 *   - If position === 1, then P_Score = 100
 *   - Else: P_Score = (1 - (position / totalResults)) * 100
 * - C (Competitors Component): The competitorsAvgScore value (0-100)
 * 
 * @param inputs - Object containing all score components
 * @returns Object with finalScore (0-100) and breakdown for debugging
 */
export function calculateServiceAivScore(
  inputs: ServiceAivScoreInputs,
): ServiceAivScoreBreakdown & { finalScore: number } {
  const { isVisible, position, totalResults, competitorsAvgScore } = inputs;

  // Validate inputs
  if (totalResults < 1) {
    throw new Error('totalResults must be at least 1');
  }

  if (competitorsAvgScore < 0 || competitorsAvgScore > 100) {
    throw new Error('competitorsAvgScore must be between 0 and 100');
  }

  if (position !== null && (position < 1 || position > totalResults)) {
    throw new Error(
      `position must be between 1 and totalResults (${totalResults}), got ${position}`,
    );
  }

  // V (Visibility): 1 if visible, 0 if not
  const V = isVisible ? 1 : 0;

  // Calculate P_Score (Position Component)
  let P_Score: number;
  if (!isVisible || position === null) {
    // If not visible or position is null, P_Score = 0
    P_Score = 0;
  } else if (position === 1) {
    // If position is 1, P_Score = 100
    P_Score = 100;
  } else {
    // Else: P_Score = (1 - (position / totalResults)) * 100
    P_Score = (1 - position / totalResults) * 100;
    // Ensure P_Score is within 0-100 range
    P_Score = Math.max(0, Math.min(100, P_Score));
  }

  // C (Competitors Component): The competitorsAvgScore value (0-100)
  const C = competitorsAvgScore;

  // Calculate individual parts
  const visibilityPart = V * 100 * 0.3; // V * 100 * 0.30
  const positionPart = P_Score * 0.25; // P_Score * 0.25
  const competitorPart = C * 0.2; // C * 0.20

  // Calculate final score: V * ((V * 100 * 0.30) + (P_Score * 0.25) + (C * 0.20))
  const finalScore = V * (visibilityPart + positionPart + competitorPart);

  // Round to 2 decimal places and ensure it's within bounds
  const roundedFinalScore = Math.max(0, Math.min(100, Math.round(finalScore * 100) / 100));

  return {
    visibilityPart: Math.round(visibilityPart * 100) / 100,
    positionPart: Math.round(positionPart * 100) / 100,
    competitorPart: Math.round(competitorPart * 100) / 100,
    finalScore: roundedFinalScore,
  };
}

