'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';

import {
  AlertCircle, Trophy, Target, TrendingUp, Calculator, ExternalLink,
  CheckCircle2, XCircle, Lightbulb, BarChart3
} from 'lucide-react';
import type { ServiceAnalysisData } from '~/lib/actions/playground-test';
import {
  calculateServiceAivScore,
  type ServiceAivScoreBreakdown,
} from '~/lib/modules/analytics/calculator';

// Horizon UI Design Tokens
const HORIZON = {
  primary: '#4318FF',
  primaryLight: '#4318FF15',
  secondary: '#A3AED0',
  secondaryLight: '#A3AED015',
  success: '#01B574',
  successLight: '#01B57415',
  warning: '#FFB547',
  warningLight: '#FFB54715',
  error: '#EE5D50',
  errorLight: '#EE5D5015',
  info: '#2B77E5',
  infoLight: '#2B77E515',
  background: '#F4F7FE',
  cardBg: '#FFFFFF',
  textPrimary: '#1B2559',
  textSecondary: '#A3AED0',
  shadow: '0 18px 40px rgba(112, 144, 176, 0.12)',
  shadowSm: '0 4px 12px rgba(112, 144, 176, 0.1)',
};

// Horizon Card Component
interface HorizonCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: React.ElementType;
  iconColor?: string;
}

const HorizonCard = ({ children, className = '', title, subtitle, icon: Icon, iconColor }: HorizonCardProps) => (
  <Card
    className={`border-none bg-white rounded-[20px] overflow-hidden transition-all duration-300 ${className}`}
    style={{ boxShadow: HORIZON.shadow }}
  >
    {(title || subtitle) && (
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          {Icon && (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: iconColor ? `${iconColor}15` : HORIZON.primaryLight }}
            >
              <Icon className="w-5 h-5" style={{ color: iconColor || HORIZON.primary }} />
            </div>
          )}
          <div>
            {title && (
              <h3 className="text-lg font-bold" style={{ color: HORIZON.textPrimary }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm" style={{ color: HORIZON.textSecondary }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
    )}
    <CardContent className={`p-6 ${(title || subtitle) ? 'pt-2' : ''}`}>
      {children}
    </CardContent>
  </Card>
);

interface ServiceAnalysisDetailProps {
  data: ServiceAnalysisData;
  domain?: string;
  competitorsAvgScore?: number;
  targetPage?: string;
  country?: string;
}

export function ServiceAnalysisDetail({
  data,
  domain,
  competitorsAvgScore = 70,
  targetPage,
  country = 'UA',
}: ServiceAnalysisDetailProps) {
  const { query, location, foundUrl, position, totalResults, competitors, recommendationText } = data;

  const _finalTargetPage = targetPage || (domain ? `https://${domain}` : '');
  const city = location.split(',')[0]?.trim() || location;

  const truncateText = (text: string, maxLength: number = 30): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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

  const normalizeDomain = (url: string | null | undefined): string | null => {
    if (!url) return null;
    return url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  };

  const targetDomain = domain || (foundUrl ? normalizeDomain(foundUrl) : null);
  const normalizedDomain = targetDomain ? normalizeDomain(targetDomain) : null;

  const isOurClinic = (competitor: { name: string; url?: string }): boolean => {
    if (!normalizedDomain) return false;
    const competitorUrl = competitor.url ? normalizeDomain(competitor.url) : null;
    const competitorName = competitor.name.toLowerCase();
    const domainBase = normalizedDomain.split('.')[0] || '';
    return !!(
      competitorUrl === normalizedDomain ||
      (domainBase && competitorName.includes(domainBase)) ||
      (competitorUrl && competitorUrl.includes(domainBase))
    );
  };

  const estimateCompetitorScore = (rank: number, total: number): number => {
    if (rank === 1) return 90;
    if (rank === 2) return 80;
    if (rank === 3) return 70;
    return Math.max(30, 100 - (rank - 1) * (70 / Math.max(total - 1, 1)));
  };

  const sortedCompetitors = [...competitors].sort((a, b) => a.rank - b.rank);

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 70) return HORIZON.success;
    if (score >= 40) return HORIZON.warning;
    return HORIZON.error;
  };



  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: HORIZON.primaryLight }}
        >
          <Target className="w-5 h-5" style={{ color: HORIZON.primary }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: HORIZON.textPrimary }}>
          Service Analysis Detail
        </h2>
      </div>

      {/* AIV Score Card - Hero Style */}
      <HorizonCard icon={Calculator} iconColor={HORIZON.primary} title="AIV Score Breakdown" subtitle="Calculated using visibility, position, and competitor metrics">
        {/* Big Score Display */}
        <div
          className="text-center py-8 mb-6 rounded-[16px]"
          style={{ backgroundColor: HORIZON.background }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: HORIZON.textSecondary }}>
            Final AIV Score
          </p>
          <div className="flex items-center justify-center gap-2">
            <span
              className="text-6xl font-bold"
              style={{ color: getScoreColor(aivScoreResult.finalScore) }}
            >
              {aivScoreResult.finalScore.toFixed(1)}
            </span>
            <span className="text-2xl" style={{ color: HORIZON.textSecondary }}>/ 100</span>
          </div>
          <div className="mt-4 w-64 mx-auto">
            <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#E9EDF7' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${aivScoreResult.finalScore}%`,
                  backgroundColor: getScoreColor(aivScoreResult.finalScore)
                }}
              />
            </div>
          </div>
        </div>

        {/* Formula Breakdown - 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Visibility */}
          <div className="p-4 rounded-[16px]" style={{ backgroundColor: HORIZON.primaryLight }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: HORIZON.primary }}>
                Visibility (30%)
              </span>
              <span className="text-lg font-bold" style={{ color: HORIZON.primary }}>
                +{aivScoreResult.visibilityPart.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {foundUrl ? (
                <>
                  <CheckCircle2 className="w-4 h-4" style={{ color: HORIZON.success }} />
                  <span className="text-sm font-medium" style={{ color: HORIZON.textPrimary }}>Visible</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" style={{ color: HORIZON.error }} />
                  <span className="text-sm font-medium" style={{ color: HORIZON.textPrimary }}>Not Visible</span>
                </>
              )}
            </div>
          </div>

          {/* Position */}
          <div className="p-4 rounded-[16px]" style={{ backgroundColor: HORIZON.infoLight }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: HORIZON.info }}>
                Position (25%)
              </span>
              <span className="text-lg font-bold" style={{ color: HORIZON.info }}>
                +{aivScoreResult.positionPart.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" style={{ color: HORIZON.info }} />
              <span className="text-sm font-medium" style={{ color: HORIZON.textPrimary }}>
                {position ? `Rank #${position}` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Competitor Environment */}
          <div className="p-4 rounded-[16px]" style={{ backgroundColor: HORIZON.successLight }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: HORIZON.success }}>
                Competitor Env (20%)
              </span>
              <span className="text-lg font-bold" style={{ color: HORIZON.success }}>
                +{aivScoreResult.competitorPart.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: HORIZON.success }} />
              <span className="text-sm font-medium" style={{ color: HORIZON.textPrimary }}>
                Avg: {competitorsAvgScore.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </HorizonCard>

      {/* Competitor Leaderboard */}
      {sortedCompetitors.length > 0 && (
        <HorizonCard icon={Trophy} iconColor={HORIZON.warning} title="Competitor Leaderboard" subtitle="Ranking of clinics found in AI recommendations">
          <div className="space-y-3">
            {sortedCompetitors.map((competitor, index) => {
              const isOur = isOurClinic(competitor);
              const estScore = estimateCompetitorScore(competitor.rank, totalResults);

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-[16px] transition-all"
                  style={{
                    backgroundColor: isOur ? HORIZON.primaryLight : HORIZON.background,
                    border: isOur ? `2px solid ${HORIZON.primary}` : 'none'
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Badge */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{
                        backgroundColor: competitor.rank <= 3 ? HORIZON.success : HORIZON.secondary,
                        color: 'white'
                      }}
                    >
                      {competitor.rank === 1 && <Trophy className="w-5 h-5" />}
                      {competitor.rank !== 1 && `#${competitor.rank}`}
                    </div>

                    {/* Name */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{ color: isOur ? HORIZON.primary : HORIZON.textPrimary }}>
                          {competitor.name}
                        </span>
                        {isOur && (
                          <Badge
                            className="text-xs font-semibold rounded-lg"
                            style={{ backgroundColor: HORIZON.primary, color: 'white' }}
                          >
                            YOU
                          </Badge>
                        )}
                      </div>
                      {competitor.url && (
                        <span className="text-xs" style={{ color: HORIZON.textSecondary }}>
                          {truncateText(competitor.url, 30)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E9EDF7' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${estScore}%`,
                          backgroundColor: getScoreColor(estScore)
                        }}
                      />
                    </div>
                    <span className="font-bold min-w-[40px] text-right" style={{ color: HORIZON.textPrimary }}>
                      {estScore.toFixed(0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </HorizonCard>
      )}

      {/* Service Results Summary */}
      <HorizonCard icon={BarChart3} iconColor={HORIZON.info} title="Service Results Summary" subtitle="Detailed breakdown of service visibility analysis">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Query */}
          <div className="p-4 rounded-[16px]" style={{ backgroundColor: HORIZON.background }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: HORIZON.textSecondary }}>
              Query
            </p>
            <p className="font-semibold text-sm" style={{ color: HORIZON.textPrimary }}>
              {truncateText(query, 25)}
            </p>
          </div>

          {/* Location */}
          <div className="p-4 rounded-[16px]" style={{ backgroundColor: HORIZON.background }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: HORIZON.textSecondary }}>
              Location
            </p>
            <p className="font-semibold text-sm" style={{ color: HORIZON.textPrimary }}>
              {city}, {country}
            </p>
          </div>

          {/* Visibility */}
          <div className="p-4 rounded-[16px]" style={{ backgroundColor: HORIZON.background }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: HORIZON.textSecondary }}>
              Visibility
            </p>
            <div className="flex items-center gap-2">
              {foundUrl ? (
                <>
                  <CheckCircle2 className="w-4 h-4" style={{ color: HORIZON.success }} />
                  <span className="font-semibold text-sm" style={{ color: HORIZON.success }}>Present</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" style={{ color: HORIZON.error }} />
                  <span className="font-semibold text-sm" style={{ color: HORIZON.error }}>Not Found</span>
                </>
              )}
            </div>
          </div>

          {/* Position */}
          <div className="p-4 rounded-[16px]" style={{ backgroundColor: HORIZON.background }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: HORIZON.textSecondary }}>
              Position / Total
            </p>
            <p className="font-semibold text-sm" style={{ color: HORIZON.textPrimary }}>
              {position ? `#${position}` : '—'} / {totalResults}
            </p>
          </div>
        </div>

        {/* Found URL */}
        {foundUrl && (
          <div className="mt-4 p-4 rounded-[16px]" style={{ backgroundColor: HORIZON.successLight }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: HORIZON.success }}>
              Found URL
            </p>
            <a
              href={foundUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 font-medium text-sm hover:underline"
              style={{ color: HORIZON.success }}
            >
              <span>{truncateText(foundUrl, 50)}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </HorizonCard>

      {/* AI Optimization Advice */}
      <HorizonCard icon={Lightbulb} iconColor={HORIZON.warning} title="AI Optimization Advice" subtitle="Recommendations to improve your AI visibility">
        <div
          className="p-6 rounded-[16px]"
          style={{ backgroundColor: HORIZON.warningLight }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${HORIZON.warning}30` }}
            >
              <AlertCircle className="w-6 h-6" style={{ color: HORIZON.warning }} />
            </div>
            <div>
              <p className="font-semibold mb-2" style={{ color: HORIZON.textPrimary }}>
                Recommendations
              </p>
              <p className="text-sm leading-relaxed" style={{ color: HORIZON.textPrimary }}>
                {recommendationText ||
                  (foundUrl
                    ? `Your service ranked #${position} out of ${totalResults} results. To improve your ranking, focus on enhancing your E-E-A-T signals, local presence, and technical optimization.`
                    : "Your site was not found in AI recommendations. Try adding 'llms.txt', updating your Local Business Schema, and improving your online presence through content optimization and local SEO.")}
              </p>
            </div>
          </div>
        </div>
      </HorizonCard>
    </div>
  );
}
