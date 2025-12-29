'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  ChevronDown,
  MapPin,
  MessageSquare,
  TrendingUp,
  Link2,
  Share2,
  Code,
  AlertTriangle,
  Facebook,
  Instagram,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@kit/ui/collapsible';
import { cn } from '@kit/ui/utils';
import type { LocalIndicatorsAuditResult } from '~/lib/server/services/local/types';

// ============ HORIZON UI DESIGN TOKENS ============
const HORIZON = {
  primary: '#4318FF',
  primaryLight: '#4318FF15',
  primaryDark: '#3311CC',
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
  textPrimary: '#1B2559',
  textSecondary: '#A3AED0',
  textMuted: '#8F9BBA',
  background: '#F4F7FE',
  cardBg: '#FFFFFF',
  shadow: '0 18px 40px rgba(112, 144, 176, 0.12)',
  shadowHover: '0 25px 50px rgba(112, 144, 176, 0.18)',
  shadowSm: '0 4px 12px rgba(112, 144, 176, 0.1)',
};

// --- Custom Modern Components ---
interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

const HorizonCard = ({ children, className, title, subtitle }: BentoCardProps) => (
  <Card
    className={cn(
      "border-none bg-white rounded-[20px] overflow-hidden transition-all duration-300",
      className
    )}
    style={{ boxShadow: HORIZON.shadow }}
  >
    {(title || subtitle) && (
      <CardHeader className="pb-2">
        {title && (
          <h3 className="text-sm font-bold uppercase tracking-widest mb-1" style={{ color: HORIZON.textSecondary }}>
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm font-bold" style={{ color: HORIZON.textPrimary }}>
            {subtitle}
          </p>
        )}
      </CardHeader>
    )}
    <CardContent className={cn("p-6", (title || subtitle) && "pt-2")}>
      {children}
    </CardContent>
  </Card>
);

interface LocalIndicatorsSectionProps {
  result: LocalIndicatorsAuditResult;
  className?: string;
}

/**
 * Progress Bar Component
 */
interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function ProgressBar({ value, max = 100, label, showValue = true, size = 'md' }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const getColor = () => {
    if (percentage < 50) return HORIZON.error;
    if (percentage < 90) return HORIZON.warning;
    return HORIZON.success;
  };

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-bold" style={{ color: HORIZON.textSecondary }}>{label}</span>
          {showValue && (
            <span className="text-xs font-bold" style={{ color: HORIZON.textPrimary }}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn('w-full rounded-full overflow-hidden relative', heightClasses[size])}
        style={{ backgroundColor: HORIZON.background }}
      >
        <div
          className="transition-all duration-500 ease-out rounded-full"
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: getColor(),
            minWidth: percentage > 0 ? '4px' : '0',
          }}
        />
      </div>
    </div>
  );
}

/**
 * Enhanced Minimal Metric Card Component
 */
interface MinimalMetricCardProps {
  title: string;
  icon?: React.ReactNode;
  status: 'good' | 'bad' | 'warning' | 'neutral';
  value?: string | number | React.ReactNode;
  score?: number | null;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

function MinimalMetricCard({
  title,
  icon,
  status,
  value,
  score,
  children,
  defaultOpen = false
}: MinimalMetricCardProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  // Auto-calculate score from status if score is not provided
  const calculatedScore = score !== undefined && score !== null
    ? score
    : status === 'good'
      ? 100
      : status === 'warning'
        ? 50
        : status === 'bad'
          ? 0
          : null;

  const getStatusIcon = () => {
    switch (status) {
      case 'good':
        return <CheckCircle2 className="h-5 w-5" style={{ color: HORIZON.success }} />;
      case 'bad':
        return <XCircle className="h-5 w-5" style={{ color: HORIZON.error }} />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" style={{ color: HORIZON.warning }} />;
      default:
        return <Info className="h-5 w-5" style={{ color: HORIZON.textSecondary }} />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return 'bg-white';
      case 'bad':
        return 'bg-white';
      case 'warning':
        return 'bg-white';
      default:
        return 'bg-white';
    }
  };

  return (
    <HorizonCard className={cn('border-none', getStatusColor())}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="cursor-pointer hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl bg-white shadow-sm border",
                  status === 'good' ? 'border-emerald-100' :
                    status === 'bad' ? 'border-red-100' :
                      status === 'warning' ? 'border-orange-100' :
                        'border-slate-100'
                )}>
                  {icon || getStatusIcon()}
                </div>
                <CardTitle className="text-base font-bold text-slate-900">
                  {title}
                </CardTitle>
              </div>
              <div className="flex items-center gap-4">
                {calculatedScore !== null && calculatedScore !== undefined ? (
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-2xl font-bold tracking-tighter',
                      calculatedScore >= 90 ? 'text-[#01B574]' :
                        calculatedScore >= 50 ? 'text-[#FFB547]' :
                          'text-[#EE5D50]'
                    )}>
                      {calculatedScore}
                    </span>
                    <span className="text-sm font-bold" style={{ color: HORIZON.textSecondary }}>/100</span>
                  </div>
                ) : null}
                {value && (
                  <span className="text-sm font-bold text-slate-700">
                    {value}
                  </span>
                )}
                <ChevronDown className={cn(
                  'h-5 w-5 text-slate-400 transition-transform',
                  isOpen && 'rotate-180'
                )} />
              </div>
            </div>
            {calculatedScore !== null && calculatedScore !== undefined ? (
              <div className="mt-2">
                <ProgressBar value={calculatedScore} size="sm" showValue={false} />
              </div>
            ) : (
              <div className="mt-2 h-2 w-full bg-slate-100 rounded-full" />
            )}
          </div>
        </CollapsibleTrigger>
        {children && (
          <CollapsibleContent>
            <div className="pt-4 border-t" style={{ borderColor: HORIZON.background }}>
              {children}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </HorizonCard>
  );
}

/**
 * Checklist Item Component
 */
interface ChecklistItemProps {
  label: string;
  checked: boolean;
}

function ChecklistItem({ label, checked }: ChecklistItemProps) {
  return (
    <div className="flex items-center gap-3">
      {checked ? (
        <div className="p-1 rounded-lg bg-emerald-50 border border-emerald-100">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
        </div>
      ) : (
        <div className="p-1 rounded-lg bg-red-50 border border-red-100">
          <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
        </div>
      )}
      <span className={cn(
        'text-sm font-medium',
        checked ? 'text-[#1B2559]' : 'text-[#A3AED0]'
      )}>
        {label}
      </span>
    </div>
  );
}

/**
 * Calculate Overall Score for Local Indicators
 */
function calculateOverallScore(data: LocalIndicatorsAuditResult): number {
  const scores: number[] = [];

  // Google Business Profile completeness
  scores.push(data.google_business_profile.completeness_percent);

  // Review response rate
  scores.push(data.review_response.response_rate_24h_percent);

  // GBP engagement CTR
  scores.push(data.gbp_engagement.ctr_percent);

  // Local backlinks (5+ is good = 100, <5 is proportional)
  const backlinksScore = data.local_backlinks.unique_local_domains >= 5
    ? 100
    : (data.local_backlinks.unique_local_domains / 5) * 100;
  scores.push(backlinksScore);

  // Social media (both profiles = 100, one = 50, none = 0)
  const socialScore = data.local_social_media.facebook.has_profile && data.local_social_media.instagram.has_profile
    ? 100
    : data.local_social_media.facebook.has_profile || data.local_social_media.instagram.has_profile
      ? 50
      : 0;
  scores.push(socialScore);

  // Local Business Schema (implemented and functioning = 100, implemented = 50, not = 0)
  const schemaScore = data.local_business_schema.is_functioning_correctly
    ? 100
    : data.local_business_schema.is_implemented
      ? 50
      : 0;
  scores.push(schemaScore);

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * Calculate Category Scores for Local Indicators
 */
function calculateCategoryScores(data: LocalIndicatorsAuditResult) {
  return {
    gbp: data.google_business_profile.completeness_percent,
    reviews: data.review_response.response_rate_24h_percent,
    engagement: data.gbp_engagement.ctr_percent,
    backlinks: data.local_backlinks.unique_local_domains >= 5
      ? 100
      : (data.local_backlinks.unique_local_domains / 5) * 100,
    social: data.local_social_media.facebook.has_profile && data.local_social_media.instagram.has_profile
      ? 100
      : data.local_social_media.facebook.has_profile || data.local_social_media.instagram.has_profile
        ? 50
        : 0,
    schema: data.local_business_schema.is_functioning_correctly
      ? 100
      : data.local_business_schema.is_implemented
        ? 50
        : 0,
  };
}

/**
 * Local Indicators Audit Section Component
 */
export function LocalIndicatorsSection({ result, className }: LocalIndicatorsSectionProps) {
  const overallScore = calculateOverallScore(result);
  const categoryScores = calculateCategoryScores(result);

  const getScoreColor = (score: number) => {
    if (score >= 90) return HORIZON.success;
    if (score >= 50) return HORIZON.warning;
    return HORIZON.error;
  };

  return (
    <div className={cn('space-y-6 pb-20 animate-in fade-in duration-700', className)}>
      {/* Hero Section */}
      <HorizonCard className="border-none relative overflow-hidden bg-white">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
          <MapPin className="w-24 h-24" style={{ color: HORIZON.primary }} />
        </div>
        <CardHeader>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: HORIZON.textPrimary }}>
                Local Score
              </h1>
              <p className="text-sm font-medium" style={{ color: HORIZON.textSecondary }}>
                Комплексна оцінка вашого локального SEO та присутності бізнесу
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold tracking-tighter mb-1" style={{ color: getScoreColor(overallScore) }}>
                {overallScore}
              </div>
              <div className="text-sm font-bold" style={{ color: HORIZON.textSecondary }}>
                / 100
              </div>
            </div>
          </div>

          {/* Category Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <div className="space-y-3 p-4 rounded-[20px]" style={{ backgroundColor: HORIZON.background }}>
              <ProgressBar value={categoryScores.gbp} size="md" label="Google Business Profile" />
            </div>
            <div className="space-y-3 p-4 rounded-[20px]" style={{ backgroundColor: HORIZON.background }}>
              <ProgressBar value={categoryScores.reviews} size="md" label="Reviews Response" />
            </div>
            <div className="space-y-3 p-4 rounded-[20px]" style={{ backgroundColor: HORIZON.background }}>
              <ProgressBar value={categoryScores.engagement} size="md" label="Profile Engagement" />
            </div>
            <div className="space-y-3 p-4 rounded-[20px]" style={{ backgroundColor: HORIZON.background }}>
              <ProgressBar value={categoryScores.backlinks} size="md" label="Local Backlinks" />
            </div>
            <div className="space-y-3 p-4 rounded-[20px]" style={{ backgroundColor: HORIZON.background }}>
              <ProgressBar value={categoryScores.social} size="md" label="Social Presence" />
            </div>
            <div className="space-y-3 p-4 rounded-[20px]" style={{ backgroundColor: HORIZON.background }}>
              <ProgressBar value={categoryScores.schema} size="md" label="Local Schema" />
            </div>
          </div>
        </CardHeader>
      </HorizonCard>

      {/* 1. Google Business Profile (Completeness) */}
      <MinimalMetricCard
        title="Google Business Profile (Completeness)"
        icon={<MapPin className="h-5 w-5" />}
        status={
          result.google_business_profile.completeness_percent >= 80
            ? 'good'
            : result.google_business_profile.completeness_percent >= 50
              ? 'warning'
              : 'bad'
        }
        score={result.google_business_profile.completeness_percent}
        value={`${result.google_business_profile.completeness_percent}% complete`}
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-600 mb-4 leading-relaxed">
              The degree to which all available fields in the Google Business Profile are filled: categories, business hours, attributes, description, photos, services, Q&A, posts.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Fields Filled</div>
                <div className="text-xl font-black italic tracking-tighter text-slate-900">
                  {result.google_business_profile.filled_fields_count} / {result.google_business_profile.total_fields_count}
                </div>
              </div>
              <div className="p-4 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Photos</div>
                <div className="text-xl font-black italic tracking-tighter text-slate-900">
                  {result.google_business_profile.photos_count} total
                </div>
                <div className="text-xs font-bold text-slate-600 mt-1">
                  {result.google_business_profile.high_quality_photos_count} high-quality
                </div>
              </div>
              <div className="p-4 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Services</div>
                <div className="text-xl font-black italic tracking-tighter text-slate-900">
                  {result.google_business_profile.services_count}
                </div>
              </div>
              <div className="p-4 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Posts/Month</div>
                <div className="text-xl font-black italic tracking-tighter text-slate-900">
                  {result.google_business_profile.posts_per_month.toFixed(1)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <ChecklistItem
                label="Description present"
                checked={result.google_business_profile.has_description}
              />
              <ChecklistItem
                label="Business hours set"
                checked={result.google_business_profile.has_business_hours}
              />
              <ChecklistItem
                label="All days have hours"
                checked={result.google_business_profile.has_all_days_hours}
              />
              <ChecklistItem
                label="Q&A section exists"
                checked={result.google_business_profile.has_qa}
              />
              <ChecklistItem
                label={`High-quality photos (${result.google_business_profile.high_quality_photos_count} / 10+ recommended)`}
                checked={result.google_business_profile.high_quality_photos_count >= 10}
              />
              <ChecklistItem
                label={`Attributes (${result.google_business_profile.attributes_count} / 15+ recommended)`}
                checked={result.google_business_profile.attributes_count >= 15}
              />
            </div>
          </div>

          {/* Good/Bad Examples */}
          <div className="pt-4 border-t border-slate-100">
            <h4 style={{ color: HORIZON.textSecondary }}>
              Best Practices
            </h4>
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-white border border-emerald-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  </div>
                  <div className="text-xs font-medium text-slate-700 leading-relaxed">
                    <strong className="text-emerald-700 font-bold">Good Example:</strong> Profile with 100% of fields filled, 20+ high-quality photos, service descriptions, business hours for every day, 15+ attributes, and regular posts about promotions and news.
                  </div>
                </div>
              </div>
              <div className="p-4 bg-red-50/50 rounded-xl border border-red-100">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-white border border-red-100">
                    <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  </div>
                  <div className="text-xs font-medium text-slate-700 leading-relaxed">
                    <strong className="text-red-700 font-bold">Bad Example:</strong> Only name, address, and phone number; no description; 2–3 outdated photos; business hours missing; no posts.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calculation */}
          <div className="pt-4 border-t border-slate-100">
            <h4 style={{ color: HORIZON.textSecondary }}>
              Calculation
            </h4>
            <div className="space-y-2 text-sm font-medium text-slate-600">
              <p>• % of filled profile fields (mandatory + optional)</p>
              <p>• Number of high-quality photos (minimum 10–15, including exterior, interior, team, equipment)</p>
              <p>• Number of active services/categories listed</p>
              <p>• Presence and regularity of Google Posts (at least 1 per month)</p>
            </div>
          </div>
        </div>
      </MinimalMetricCard>

      {/* 2. Review Response Rate & Quality */}
      <MinimalMetricCard
        title="Review Response Rate & Quality"
        icon={<MessageSquare className="h-5 w-5" />}
        status={
          result.review_response.response_rate_24h_percent >= 90
            ? 'good'
            : result.review_response.response_rate_24h_percent >= 50
              ? 'warning'
              : 'bad'
        }
        score={result.review_response.response_rate_24h_percent}
        value={`${result.review_response.response_rate_24h_percent}% within 24h`}
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-600 mb-4 leading-relaxed">
              The speed and quality of the clinic&apos;s responses to new reviews on Google, DOC.ua, and Helsi.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Total Reviews</div>
                <div className="text-xl font-black italic tracking-tighter text-slate-900">
                  {result.review_response.total_reviews}
                </div>
              </div>
              <div className="p-4 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Responded</div>
                <div className="text-xl font-black italic tracking-tighter text-slate-900">
                  {result.review_response.responded_reviews}
                </div>
                <div className="text-xs font-bold text-slate-600 mt-1">
                  {result.review_response.response_rate_percent}% overall
                </div>
              </div>
              <div className="p-4 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">24h Response</div>
                <div className="text-xl font-black italic tracking-tighter text-slate-900">
                  {result.review_response.responded_within_24h}
                </div>
                <div className="text-xs font-bold text-slate-600 mt-1">
                  {result.review_response.response_rate_24h_percent}%
                </div>
              </div>
              <div className="p-4 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Negative Reviews</div>
                <div className="text-xl font-black italic tracking-tighter text-slate-900">
                  {result.review_response.negative_reviews_count}
                </div>
                <div className="text-xs font-bold text-slate-600 mt-1">
                  {result.review_response.negative_response_rate_percent}% responded
                </div>
              </div>
            </div>

            {/* Platforms breakdown */}
            {result.review_response.platforms.length > 0 && (
              <div className="pt-2">
                <h4 style={{ color: HORIZON.textSecondary }}>
                  By Platform
                </h4>
                <div className="space-y-2">
                  {result.review_response.platforms.map((platform, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                      <span className="text-sm font-bold text-slate-700 capitalize">
                        {platform.platform}
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-black italic tracking-tighter text-slate-900">
                          {platform.response_rate_percent}%
                        </div>
                        <div className="text-xs font-bold text-slate-600">
                          {platform.responded_reviews} / {platform.total_reviews}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Good/Bad Examples */}
          <div className="pt-4 border-t border-slate-100">
            <h4 style={{ color: HORIZON.textSecondary }}>
              Best Practices
            </h4>
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-white border border-emerald-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  </div>
                  <div className="text-xs font-medium text-slate-700 leading-relaxed">
                    <strong className="text-emerald-700 font-bold">Good Example:</strong> 90% of reviews receive a personalized response within 24 hours; negative reviews are handled with an apology and a proposal to resolve the issue.
                  </div>
                </div>
              </div>
              <div className="p-4 bg-red-50/50 rounded-xl border border-red-100">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-white border border-red-100">
                    <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  </div>
                  <div className="text-xs font-medium text-slate-700 leading-relaxed">
                    <strong className="text-red-700 font-bold">Bad Example:</strong> Most reviews remain unanswered for weeks; there is no reaction to negative feedback at all.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calculation */}
          <div className="pt-4 border-t border-slate-100">
            <h4 style={{ color: HORIZON.textSecondary }}>
              Calculation
            </h4>
            <p className="text-sm font-medium text-slate-600">
              % of reviews receiving a response from the clinic within 24 hours of the user posting the review.
            </p>
          </div>
        </div>
      </MinimalMetricCard>

      {/* 3. Google Business Profile Engagement */}
      <MinimalMetricCard
        title="Google Business Profile Engagement"
        icon={<TrendingUp className="h-5 w-5" />}
        status={
          result.gbp_engagement.ctr_percent >= 5
            ? 'good'
            : result.gbp_engagement.ctr_percent >= 1
              ? 'warning'
              : 'bad'
        }
        score={result.gbp_engagement.ctr_percent}
        value={`${result.gbp_engagement.ctr_percent}% CTR`}
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-600 mb-4 leading-relaxed">
              The number of times the clinic&apos;s profile appeared in search or on the map (Impressions), and the actions users took: website clicks, direction requests, calls, photo views, bookings.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Impressions/Month</div>
                <div className="text-xl font-black italic tracking-tighter text-slate-900">
                  {result.gbp_engagement.impressions_per_month.toLocaleString()}
                </div>
                <div className="text-xs font-bold text-slate-600 mt-1">
                  {result.gbp_engagement.search_impressions.toLocaleString()} search + {result.gbp_engagement.maps_impressions.toLocaleString()} maps
                </div>
              </div>
              <div className="p-4 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Website Clicks</div>
                <div className="text-xl font-black italic tracking-tighter text-slate-900">
                  {result.gbp_engagement.website_clicks_per_month.toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Phone Calls</div>
                <div className="text-xl font-black italic tracking-tighter text-slate-900">
                  {result.gbp_engagement.calls_per_month.toLocaleString()}
                </div>
              </div>
              <div className="p-4 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Direction Requests</div>
                <div className="text-xl font-black italic tracking-tighter text-slate-900">
                  {result.gbp_engagement.direction_requests_per_month.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Click-Through Rate (CTR)</span>
                <span className={cn(
                  'text-3xl font-black italic tracking-tighter',
                  result.gbp_engagement.ctr_percent >= 5 ? 'text-emerald-600' :
                    result.gbp_engagement.ctr_percent >= 1 ? 'text-orange-600' :
                      'text-red-600'
                )}>
                  {result.gbp_engagement.ctr_percent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Good/Bad Examples */}
          <div className="pt-4 border-t border-slate-100">
            <h4 style={{ color: HORIZON.textSecondary }}>
              Best Practices
            </h4>
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-white border border-emerald-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  </div>
                  <div className="text-xs font-medium text-slate-700 leading-relaxed">
                    <strong className="text-emerald-700 font-bold">Good Example:</strong> 10,000 impressions per month, 500 website clicks, 200 calls, 300 direction requests — CTR ~10%.
                  </div>
                </div>
              </div>
              <div className="p-4 bg-red-50/50 rounded-xl border border-red-100">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-white border border-red-100">
                    <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  </div>
                  <div className="text-xs font-medium text-slate-700 leading-relaxed">
                    <strong className="text-red-700 font-bold">Bad Example:</strong> 5,000 impressions, only 20 clicks, 5 calls — CTR &lt; 0.5%, indicating low relevance or an unattractive profile.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calculation */}
          <div className="pt-4 border-t border-slate-100">
            <h4 style={{ color: HORIZON.textSecondary }}>
              Calculation
            </h4>
            <div className="space-y-2 text-sm font-medium text-slate-600">
              <p>• Number of profile impressions per month (Search + Maps)</p>
              <p>• Number of website clicks, calls, and direction requests per month</p>
              <p>• CTR (Click-Through Rate: the ratio of actions to impressions)</p>
            </div>
          </div>
        </div>
      </MinimalMetricCard>

      {/* 4. Local Backlinks */}
      <MinimalMetricCard
        title="Local Backlinks"
        icon={<Link2 className="h-5 w-5" />}
        status={
          result.local_backlinks.unique_local_domains >= 5
            ? 'good'
            : result.local_backlinks.unique_local_domains > 0
              ? 'warning'
              : 'bad'
        }
        score={result.local_backlinks.unique_local_domains >= 5 ? 100 : (result.local_backlinks.unique_local_domains / 5) * 100}
        value={`${result.local_backlinks.unique_local_domains} local domains`}
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-600 mb-4 leading-relaxed">
              Links to the clinic&apos;s website from local sources: city portals, news sites, partners, medical associations, charity foundations, and local bloggers.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Total Backlinks</div>
                <div className="text-xl font-black italic tracking-tighter text-slate-900">
                  {result.local_backlinks.total_local_backlinks}
                </div>
              </div>
              <div className="p-4 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">Unique Domains</div>
                <div className="text-xl font-black italic tracking-tighter text-slate-900">
                  {result.local_backlinks.unique_local_domains}
                </div>
                <div className="text-xs font-bold text-slate-600 mt-1">
                  {result.local_backlinks.unique_local_domains >= 5 ? '✓ Good' : '< 5 is bad'}
                </div>
              </div>
            </div>

            {/* Backlinks by type */}
            <div className="pt-2">
              <h4 style={{ color: HORIZON.textSecondary }}>
                By Source Type
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">City Portals</div>
                  <div className="text-lg font-black italic tracking-tighter text-slate-900">
                    {result.local_backlinks.backlinks_by_type.city_portals}
                  </div>
                </div>
                <div className="p-3 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">News Sites</div>
                  <div className="text-lg font-black italic tracking-tighter text-slate-900">
                    {result.local_backlinks.backlinks_by_type.news_sites}
                  </div>
                </div>
                <div className="p-3 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Partners</div>
                  <div className="text-lg font-black italic tracking-tighter text-slate-900">
                    {result.local_backlinks.backlinks_by_type.partners}
                  </div>
                </div>
                <div className="p-3 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Associations</div>
                  <div className="text-lg font-black italic tracking-tighter text-slate-900">
                    {result.local_backlinks.backlinks_by_type.medical_associations}
                  </div>
                </div>
                <div className="p-3 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Charity</div>
                  <div className="text-lg font-black italic tracking-tighter text-slate-900">
                    {result.local_backlinks.backlinks_by_type.charity_foundations}
                  </div>
                </div>
                <div className="p-3 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Bloggers</div>
                  <div className="text-lg font-black italic tracking-tighter text-slate-900">
                    {result.local_backlinks.backlinks_by_type.local_bloggers}
                  </div>
                </div>
              </div>
            </div>

            {/* Backlinks list */}
            {result.local_backlinks.backlinks.length > 0 && (
              <div className="pt-2">
                <h4 style={{ color: HORIZON.textSecondary }}>
                  Backlinks List
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.local_backlinks.backlinks.map((backlink, idx) => (
                    <div key={idx} className="p-3 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-700 truncate">
                            {backlink.domain}
                          </div>
                          <div className="text-xs font-medium text-slate-500 truncate">
                            {backlink.url}
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-2 capitalize bg-slate-100 text-slate-700 border-slate-200">
                          {backlink.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Good/Bad Examples */}
          <div className="pt-4 border-t border-slate-100">
            <h4 style={{ color: HORIZON.textSecondary }}>
              Best Practices
            </h4>
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-white border border-emerald-100">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  </div>
                  <div className="text-xs font-medium text-slate-700 leading-relaxed">
                    <strong className="text-emerald-700 font-bold">Good Example:</strong> 20 links from city portals, local media, partner clinics, and associations; all with relevant anchors and local context.
                  </div>
                </div>
              </div>
              <div className="p-4 bg-red-50/50 rounded-xl border border-red-100">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-white border border-red-100">
                    <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  </div>
                  <div className="text-xs font-medium text-slate-700 leading-relaxed">
                    <strong className="text-red-700 font-bold">Bad Example:</strong> No links from local sources; all backlinks are from general directories without any connection to the region.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calculation */}
          <div className="pt-4 border-t border-slate-100">
            <h4 style={{ color: HORIZON.textSecondary }}>
              Calculation
            </h4>
            <p className="text-sm font-medium text-slate-600">
              Number of unique local domains linking to the clinic from the same city where the clinic is located. Metric: &lt; 5 is bad; ≥ 5 is good.
            </p>
          </div>
        </div>
      </MinimalMetricCard>

      {/* 5. Local Social Media Activity */}
      <MinimalMetricCard
        title="Local Social Media Activity"
        icon={<Share2 className="h-5 w-5" />}
        status={
          result.local_social_media.facebook.has_profile && result.local_social_media.instagram.has_profile
            ? 'good'
            : result.local_social_media.facebook.has_profile || result.local_social_media.instagram.has_profile
              ? 'warning'
              : 'bad'
        }
        score={
          result.local_social_media.facebook.has_profile && result.local_social_media.instagram.has_profile
            ? 100
            : result.local_social_media.facebook.has_profile || result.local_social_media.instagram.has_profile
              ? 50
              : 0
        }
        value={
          result.local_social_media.facebook.has_profile && result.local_social_media.instagram.has_profile
            ? 'Both profiles'
            : result.local_social_media.facebook.has_profile || result.local_social_media.instagram.has_profile
              ? 'One profile'
              : 'No profiles'
        }
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-600 mb-4 leading-relaxed">
              Active clinic profiles on Facebook and Instagram with geotags, mentions of the city/district, posts about participation in local events, and interaction with the local audience.
            </p>

            {/* Facebook */}
            <div className="p-4 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-white border border-slate-100">
                  <Facebook className="h-5 w-5 text-blue-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Facebook</h4>
              </div>
              <div className="space-y-2">
                <ChecklistItem
                  label="Profile exists"
                  checked={result.local_social_media.facebook.has_profile}
                />
                <ChecklistItem
                  label="Correct NAP (Name, Address, Phone)"
                  checked={result.local_social_media.facebook.has_correct_nap}
                />
                <ChecklistItem
                  label="Has geotags"
                  checked={result.local_social_media.facebook.has_geotags}
                />
                <ChecklistItem
                  label="City mentions"
                  checked={result.local_social_media.facebook.has_city_mentions}
                />
                <ChecklistItem
                  label="Posts about local events"
                  checked={result.local_social_media.facebook.posts_about_local_events > 0}
                />
                <ChecklistItem
                  label="Interaction with local audience"
                  checked={result.local_social_media.facebook.interaction_with_local_audience}
                />
                {result.local_social_media.facebook.profile_url && (
                  <div className="pt-2">
                    <a
                      href={result.local_social_media.facebook.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-blue-600 hover:underline"
                    >
                      View Profile →
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Instagram */}
            <div className="p-4 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-white border border-slate-100">
                  <Instagram className="h-5 w-5 text-pink-600" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Instagram</h4>
              </div>
              <div className="space-y-2">
                <ChecklistItem
                  label="Profile exists"
                  checked={result.local_social_media.instagram.has_profile}
                />
                <ChecklistItem
                  label="Correct NAP (Name, Address, Phone)"
                  checked={result.local_social_media.instagram.has_correct_nap}
                />
                <ChecklistItem
                  label="Has geotags"
                  checked={result.local_social_media.instagram.has_geotags}
                />
                <ChecklistItem
                  label="City mentions"
                  checked={result.local_social_media.instagram.has_city_mentions}
                />
                <ChecklistItem
                  label="Posts about local events"
                  checked={result.local_social_media.instagram.posts_about_local_events > 0}
                />
                <ChecklistItem
                  label="Interaction with local audience"
                  checked={result.local_social_media.instagram.interaction_with_local_audience}
                />
                {result.local_social_media.instagram.profile_url && (
                  <div className="pt-2">
                    <a
                      href={result.local_social_media.instagram.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-pink-600 hover:underline"
                    >
                      View Profile →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Calculation */}
          <div className="pt-4 border-t border-slate-100">
            <h4 style={{ color: HORIZON.textSecondary }}>
              Calculation
            </h4>
            <p className="text-sm font-medium text-slate-600">
              Presence of profiles with correct NAP (Name, Address, Phone) on Facebook and Instagram.
            </p>
          </div>
        </div>
      </MinimalMetricCard>

      {/* 6. Local Business Schema */}
      <MinimalMetricCard
        title="Local Business Schema"
        icon={<Code className="h-5 w-5" />}
        status={
          result.local_business_schema.is_functioning_correctly
            ? 'good'
            : result.local_business_schema.is_implemented
              ? 'warning'
              : 'bad'
        }
        score={
          result.local_business_schema.is_functioning_correctly
            ? 100
            : result.local_business_schema.is_implemented
              ? 50
              : 0
        }
        value={
          result.local_business_schema.is_functioning_correctly
            ? 'Valid'
            : result.local_business_schema.is_implemented
              ? 'Has errors'
              : 'Not implemented'
        }
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-600 mb-4 leading-relaxed">
              LocalBusiness schema markup is structured data that helps search engines and AI better understand information about a local business, specifically a medical clinic.
            </p>

            <div className="space-y-2">
              <ChecklistItem
                label="Schema implemented"
                checked={result.local_business_schema.is_implemented}
              />
              <ChecklistItem
                label="Schema functioning correctly"
                checked={result.local_business_schema.is_functioning_correctly}
              />
              {result.local_business_schema.schema_type && (
                <div className="pl-6 pt-1">
                  <div className="text-sm font-medium text-slate-600">
                    <strong className="font-bold">Type:</strong> {result.local_business_schema.schema_type}
                  </div>
                </div>
              )}
            </div>

            {/* Required fields */}
            <div className="pt-2">
              <h4 style={{ color: HORIZON.textSecondary }}>
                Required Fields
              </h4>
              <div className="space-y-2">
                <ChecklistItem
                  label="Name"
                  checked={result.local_business_schema.has_name}
                />
                <ChecklistItem
                  label="Address"
                  checked={result.local_business_schema.has_address}
                />
                <ChecklistItem
                  label="Phone"
                  checked={result.local_business_schema.has_phone}
                />
                <ChecklistItem
                  label="Hours"
                  checked={result.local_business_schema.has_hours}
                />
              </div>
            </div>

            {/* Optional fields */}
            {(result.local_business_schema.has_price_range || result.local_business_schema.has_aggregate_rating) && (
              <div className="pt-2">
                <h4 style={{ color: HORIZON.textSecondary }}>
                  Optional Fields
                </h4>
                <div className="space-y-2">
                  <ChecklistItem
                    label="Price Range"
                    checked={result.local_business_schema.has_price_range || false}
                  />
                  <ChecklistItem
                    label="Aggregate Rating"
                    checked={result.local_business_schema.has_aggregate_rating || false}
                  />
                </div>
              </div>
            )}

            {/* Validation status */}
            {result.local_business_schema.validation_status && (
              <div className="pt-2">
                <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-slate-100 shadow-sm">
                  <span className="text-sm font-bold text-slate-700">Validation Status</span>
                  <Badge
                    variant={
                      result.local_business_schema.validation_status === 'valid'
                        ? 'default'
                        : result.local_business_schema.validation_status === 'warning'
                          ? 'secondary'
                          : 'destructive'
                    }
                    className={
                      result.local_business_schema.validation_status === 'valid'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : result.local_business_schema.validation_status === 'warning'
                          ? 'bg-orange-100 text-orange-800 border-orange-200'
                          : ''
                    }
                  >
                    {result.local_business_schema.validation_status}
                  </Badge>
                </div>
              </div>
            )}

            {/* Errors */}
            {result.local_business_schema.schema_errors && result.local_business_schema.schema_errors.length > 0 && (
              <div className="pt-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 mb-3">
                  Errors
                </h4>
                <div className="space-y-2">
                  {result.local_business_schema.schema_errors.map((error, idx) => (
                    <div key={idx} className="text-sm font-medium text-red-600 p-2 bg-red-50/50 rounded-lg border border-red-100">
                      • {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {result.local_business_schema.schema_warnings && result.local_business_schema.schema_warnings.length > 0 && (
              <div className="pt-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 mb-3">
                  Warnings
                </h4>
                <div className="space-y-2">
                  {result.local_business_schema.schema_warnings.map((warning, idx) => (
                    <div key={idx} className="text-sm font-medium text-orange-600 p-2 bg-orange-50/50 rounded-lg border border-orange-100">
                      • {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Calculation */}
          <div className="pt-4 border-t border-slate-100">
            <h4 style={{ color: HORIZON.textSecondary }}>
              Calculation
            </h4>
            <div className="space-y-2 text-sm font-medium text-slate-600">
              <p>• Check if it is implemented</p>
              <p>• If yes, check if it is functioning correctly</p>
            </div>
          </div>
        </div>
      </MinimalMetricCard>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <HorizonCard className="border-none relative overflow-hidden bg-white shadow-[0_18px_40px_rgba(255,181,71,0.12)]">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
            <AlertTriangle className="w-24 h-24" style={{ color: HORIZON.warning }} />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold" style={{ color: HORIZON.textPrimary }}>
              <div className="p-2 rounded-xl bg-[#FFB54715] shadow-sm">
                <AlertTriangle className="h-6 w-6" style={{ color: HORIZON.warning }} />
              </div>
              Recommendations ({result.recommendations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {result.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-4 text-sm p-4 rounded-xl transition-all duration-200 hover:bg-[#F4F7FE]" style={{ border: `1px solid ${HORIZON.background}` }}>
                  <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: HORIZON.warning }} />
                  <span className="font-medium leading-relaxed" style={{ color: HORIZON.textPrimary }}>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </HorizonCard>
      )}
    </div>
  );
}






