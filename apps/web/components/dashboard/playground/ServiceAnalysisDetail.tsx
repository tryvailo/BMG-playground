'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { AlertCircle, Trophy, Target, TrendingUp, Calculator, ExternalLink } from 'lucide-react';
import type { ServiceAnalysisData } from '~/lib/actions/playground-test';
import {
  calculateServiceAivScore,
  type ServiceAivScoreBreakdown,
} from '~/lib/modules/analytics/calculator';

interface ServiceAnalysisDetailProps {
  data: ServiceAnalysisData;
  domain?: string; // Domain to highlight in competitors list
  competitorsAvgScore?: number; // Average ClinicAI score of competitors (0-100). Default: 70
  targetPage?: string; // Target page URL (optional, will be constructed from domain if not provided)
  country?: string; // Country code (optional, e.g., "UA")
}

export function ServiceAnalysisDetail({
  data,
  domain,
  competitorsAvgScore = 70, // Default average score for competitors in playground
  targetPage,
  country = 'UA', // Default country
}: ServiceAnalysisDetailProps) {
  const { query, location, foundUrl, position, totalResults, competitors, recommendationText } = data;

  // Construct target page URL if not provided
  const finalTargetPage = targetPage || (domain ? `https://${domain}` : '');

  // Extract city from location (assuming format "City" or "City, Country")
  const city = location.split(',')[0]?.trim() || location;

  // Helper functions for table rendering
  const truncateText = (text: string, maxLength: number = 30): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const renderCompetitors = (competitors: Array<{ name: string }>): string => {
    if (competitors.length === 0) return '—';
    const names = competitors.map((c) => c.name);
    if (names.length <= 2) return names.join(', ');
    return `${names.slice(0, 2).join(', ')}...`;
  };

  const renderCompetitorUrls = (competitors: Array<{ url?: string }>): React.ReactNode => {
    const urls = competitors.filter((c) => c.url).map((c) => c.url!);
    if (urls.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
    if (urls.length === 1) {
      return (
        <a
          href={urls[0]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline text-xs flex items-center gap-1"
        >
          <span className="max-w-[120px] truncate">{truncateText(urls[0], 20)}</span>
          <ExternalLink className="h-3 w-3 flex-shrink-0" />
        </a>
      );
    }
    return (
      <div className="text-xs text-muted-foreground">
        {urls.length} URLs
      </div>
    );
  };

  // Calculate AIV Score
  const aivScoreResult: ServiceAivScoreBreakdown & { finalScore: number } = useMemo(() => {
    return calculateServiceAivScore({
      isVisible: foundUrl !== null,
      position: position,
      totalResults: totalResults || 1,
      competitorsAvgScore: competitorsAvgScore,
    });
  }, [foundUrl, position, totalResults, competitorsAvgScore]);

  // Normalize domain for comparison
  const normalizeDomain = (url: string | null | undefined): string | null => {
    if (!url) return null;
    return url
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
  };

  // Use domain prop or extract from foundUrl
  const targetDomain = domain || (foundUrl ? normalizeDomain(foundUrl) : null);
  const normalizedDomain = targetDomain ? normalizeDomain(targetDomain) : null;

  // Check if a competitor is "Our Clinic"
  const isOurClinic = (competitor: { name: string; url?: string }): boolean => {
    if (!normalizedDomain) return false;
    const competitorUrl = competitor.url ? normalizeDomain(competitor.url) : null;
    const competitorName = competitor.name.toLowerCase();
    const domainBase = normalizedDomain.split('.')[0] || '';
    return (
      competitorUrl === normalizedDomain ||
      (domainBase && competitorName.includes(domainBase)) ||
      (competitorUrl && competitorUrl.includes(domainBase))
    );
  };

  // Estimate score for each competitor based on their rank
  // Higher rank (lower number) = higher estimated score
  const estimateCompetitorScore = (rank: number, total: number): number => {
    // Simple estimation: #1 gets 90, #2 gets 80, etc.
    // Or use formula: 100 - (rank - 1) * (100 / total)
    if (rank === 1) return 90;
    if (rank === 2) return 80;
    if (rank === 3) return 70;
    // For others, use decreasing formula
    return Math.max(30, 100 - (rank - 1) * (70 / Math.max(total - 1, 1)));
  };

  // Sort competitors by rank
  const sortedCompetitors = [...competitors].sort((a, b) => a.rank - b.rank);

  return (
    <div className="mt-8 space-y-6">
      {/* Section Title */}
      <div className="flex items-center gap-3">
        <Target className="h-6 w-6 text-muted-foreground" />
        <h2 className="text-2xl font-bold text-foreground">
          Service Analysis Detail
        </h2>
      </div>

      {/* Top Card: AIV Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            AIV Score Breakdown
          </CardTitle>
          <CardDescription>
            Calculated using the formula: V × ((V × 100 × 0.30) + (P_Score × 0.25) + (C × 0.20))
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Final AIV Score */}
          <div className="text-center py-6 border-b">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Final AIV Score
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl font-bold text-foreground">
                {aivScoreResult.finalScore.toFixed(1)}
              </span>
              <span className="text-2xl text-muted-foreground">/ 100</span>
            </div>
          </div>

          {/* Formula Breakdown */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground mb-3">
              Formula Breakdown:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-primary">
                    Visibility Weight (30%)
                  </span>
                  <Badge variant="info" className="text-xs">
                    +{aivScoreResult.visibilityPart.toFixed(2)}
                  </Badge>
                </div>
                <p className="text-xs text-primary/80">
                  {foundUrl ? 'Visible' : 'Not Visible'}
                </p>
              </div>

              <div className="p-3 bg-muted rounded-lg border border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-foreground">
                    Position Weight (25%)
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    +{aivScoreResult.positionPart.toFixed(2)}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {position ? `Rank #${position}` : 'N/A'}
                </p>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Competitor Env Weight (20%)
                  </span>
                  <Badge variant="success" className="text-xs">
                    +{aivScoreResult.competitorPart.toFixed(2)}
                  </Badge>
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  Avg: {competitorsAvgScore.toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Middle Section: Competitor Leaderboard */}
      {sortedCompetitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Competitor Leaderboard
            </CardTitle>
            <CardDescription>
              Ranking of clinics found in AI recommendations with estimated scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Rank</TableHead>
                    <TableHead>Clinic Name</TableHead>
                    <TableHead className="w-32">Est. Score</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCompetitors.map((competitor, index) => {
                    const isOur = isOurClinic(competitor);
                    const estScore = estimateCompetitorScore(competitor.rank, totalResults);
                    return (
                      <TableRow
                        key={index}
                        className={
                          isOur
                            ? 'bg-primary/10 font-semibold'
                            : ''
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">#{competitor.rank}</span>
                            {competitor.rank === 1 && (
                              <Trophy className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={isOur ? 'text-primary' : ''}>
                              {competitor.name}
                            </span>
                            {isOur && (
                              <Badge variant="info" className="text-xs">
                                Our Clinic
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{estScore.toFixed(0)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isOur ? (
                            <Badge variant="success" className="text-xs">
                              Visible
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Competitor
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Service Results Table</CardTitle>
          <CardDescription>
            Detailed breakdown of service visibility analysis results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-xs font-semibold text-foreground">
                    Service
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground max-w-[150px]">
                    Page
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">
                    Country
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">
                    City
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">
                    Visibility
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">
                    Found URL
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">
                    Position
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">
                    Total Results
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">
                    AIV Score
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">
                    Competitors
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">
                    Comp. URLs
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-muted/50">
                  <TableCell className="text-xs font-medium text-foreground">
                    {query}
                  </TableCell>
                  <TableCell className="text-xs max-w-[150px]">
                    {finalTargetPage ? (
                      <a
                        href={finalTargetPage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate block"
                        title={finalTargetPage}
                      >
                        {truncateText(finalTargetPage, 25)}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {country}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {city}
                  </TableCell>
                  <TableCell className="text-xs">
                    {foundUrl ? (
                      <Badge variant="success" className="text-xs">
                        Present
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Not Present
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs max-w-[150px]">
                    {foundUrl ? (
                      <a
                        href={foundUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate block flex items-center gap-1"
                        title={foundUrl}
                      >
                        <span className="truncate">{truncateText(foundUrl, 20)}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {position !== null ? `#${position}` : '—'}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {totalResults}
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge
                      variant={
                        aivScoreResult.finalScore > 70
                          ? 'success'
                          : aivScoreResult.finalScore > 40
                            ? 'warning'
                            : 'outline'
                      }
                      className="text-xs"
                    >
                      {aivScoreResult.finalScore.toFixed(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                    <div className="truncate" title={competitors.map((c) => c.name).join(', ')}>
                      {renderCompetitors(competitors)}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs max-w-[150px]">
                    {renderCompetitorUrls(competitors)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section: Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            AI Optimization Advice
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-2">
                  Recommendations
                </p>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                  {recommendationText ||
                    (foundUrl
                      ? `Your service ranked #${position} out of ${totalResults} results. To improve your ranking, focus on enhancing your E-E-A-T signals, local presence, and technical optimization.`
                      : 'Your site was not found in AI recommendations. Try adding \'llms.txt\', updating your Local Business Schema, and improving your online presence through content optimization and local SEO.')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
