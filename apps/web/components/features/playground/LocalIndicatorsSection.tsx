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
  Star,
  Clock,
  Image as ImageIcon,
  Calendar,
  Users,
  Eye,
  Phone,
  Navigation,
  Globe,
  Facebook,
  Instagram,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@kit/ui/collapsible';
import { cn } from '@kit/ui/utils';
import type { LocalIndicatorsAuditResult } from '~/lib/server/services/local/types';

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
    if (percentage < 50) return 'bg-red-500';
    if (percentage < 90) return 'bg-orange-500';
    return 'bg-emerald-500';
  };

  const heightClasses = {
    sm: 'h-2',
    md: 'h-2.5',
    lg: 'h-3',
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {showValue && (
            <span className="text-sm font-semibold text-muted-foreground">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-muted rounded-full overflow-hidden relative', heightClasses[size])}>
        <div
          className={cn('transition-all duration-500 ease-out rounded-full', getColor())}
          style={{ 
            width: `${percentage}%`, 
            height: '100%',
            minWidth: percentage > 0 ? '4px' : '0',
            minHeight: '100%'
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
        return <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      case 'bad':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
      default:
        return <Info className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return 'border-l-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20';
      case 'bad':
        return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20';
      case 'warning':
        return 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20';
      default:
        return 'border-l-border bg-muted/30';
    }
  };

  return (
    <Card className={cn(
      'hover:shadow-lg transition-all border-l-4',
      getStatusColor()
    )}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {icon || getStatusIcon()}
                <CardTitle className="text-base font-semibold text-foreground">
                  {title}
                </CardTitle>
              </div>
              <div className="flex items-center gap-4">
                {calculatedScore !== null && calculatedScore !== undefined ? (
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-lg font-bold',
                      calculatedScore >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                      calculatedScore >= 50 ? 'text-orange-600 dark:text-orange-400' :
                      'text-red-600 dark:text-red-400'
                    )}>
                      {calculatedScore}
                    </span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>
                ) : null}
                {value && (
                  <span className="text-base font-semibold text-foreground">
                    {value}
                  </span>
                )}
                <ChevronDown className={cn(
                  'h-5 w-5 text-muted-foreground transition-transform',
                  isOpen && 'rotate-180'
                )} />
              </div>
            </div>
            {calculatedScore !== null && calculatedScore !== undefined ? (
              <div className="mt-3">
                <ProgressBar value={calculatedScore} size="sm" showValue={false} />
              </div>
            ) : (
              <div className="mt-3 h-2 w-full bg-muted rounded-full" />
            )}
          </CardHeader>
        </CollapsibleTrigger>
        {children && (
          <CollapsibleContent>
            <CardContent className="pt-0">
              {children}
            </CardContent>
          </CollapsibleContent>
        )}
      </Collapsible>
    </Card>
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
    <div className="flex items-center gap-2">
      {checked ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
      )}
      <span className={cn(
        'text-sm',
        checked ? 'text-foreground' : 'text-muted-foreground'
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
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 50) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800';
    if (score >= 50) return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800';
    return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Hero Section */}
      <Card className={cn('border-2', getScoreBgColor(overallScore))}>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Local Indicators Results
              </h1>
              <p className="text-sm text-muted-foreground">
                Overall assessment of your local SEO and business presence
              </p>
            </div>
            <div className="text-center">
              <div className={cn('text-5xl font-bold mb-1', getScoreColor(overallScore))}>
                {overallScore}
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                / 100
              </div>
            </div>
          </div>
          
          {/* Category Progress Bars */}
          <div className="space-y-3 mt-6">
            <ProgressBar 
              value={categoryScores.gbp} 
              label="Google Business Profile" 
              size="md"
            />
            <ProgressBar 
              value={categoryScores.reviews} 
              label="Review Response" 
              size="md"
            />
            <ProgressBar 
              value={categoryScores.engagement} 
              label="GBP Engagement" 
              size="md"
            />
            <ProgressBar 
              value={categoryScores.backlinks} 
              label="Local Backlinks" 
              size="md"
            />
            <ProgressBar 
              value={categoryScores.social} 
              label="Social Media" 
              size="md"
            />
            <ProgressBar 
              value={categoryScores.schema} 
              label="Local Business Schema" 
              size="md"
            />
          </div>
        </CardHeader>
      </Card>

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
            <p className="text-sm text-muted-foreground mb-3">
              The degree to which all available fields in the Google Business Profile are filled: categories, business hours, attributes, description, photos, services, Q&A, posts.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Fields Filled</div>
                <div className="text-lg font-bold text-foreground">
                  {result.google_business_profile.filled_fields_count} / {result.google_business_profile.total_fields_count}
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Photos</div>
                <div className="text-lg font-bold text-foreground">
                  {result.google_business_profile.photos_count} total
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {result.google_business_profile.high_quality_photos_count} high-quality
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Services</div>
                <div className="text-lg font-bold text-foreground">
                  {result.google_business_profile.services_count}
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Posts/Month</div>
                <div className="text-lg font-bold text-foreground">
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
          <div className="pt-4 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Best Practices
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-foreground">
                    <strong className="text-emerald-800 dark:text-emerald-400">Good Example:</strong> Profile with 100% of fields filled, 20+ high-quality photos, service descriptions, business hours for every day, 15+ attributes, and regular posts about promotions and news.
                  </div>
                </div>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-foreground">
                    <strong className="text-red-800 dark:text-red-400">Bad Example:</strong> Only name, address, and phone number; no description; 2–3 outdated photos; business hours missing; no posts.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calculation */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Calculation
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
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
            <p className="text-sm text-muted-foreground mb-3">
              The speed and quality of the clinic's responses to new reviews on Google, DOC.ua, and Helsi.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Total Reviews</div>
                <div className="text-lg font-bold text-foreground">
                  {result.review_response.total_reviews}
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Responded</div>
                <div className="text-lg font-bold text-foreground">
                  {result.review_response.responded_reviews}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {result.review_response.response_rate_percent}% overall
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">24h Response</div>
                <div className="text-lg font-bold text-foreground">
                  {result.review_response.responded_within_24h}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {result.review_response.response_rate_24h_percent}%
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Negative Reviews</div>
                <div className="text-lg font-bold text-foreground">
                  {result.review_response.negative_reviews_count}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {result.review_response.negative_response_rate_percent}% responded
                </div>
              </div>
            </div>

            {/* Platforms breakdown */}
            {result.review_response.platforms.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  By Platform
                </h4>
                <div className="space-y-2">
                  {result.review_response.platforms.map((platform, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium text-foreground capitalize">
                        {platform.platform}
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-bold text-foreground">
                          {platform.response_rate_percent}%
                        </div>
                        <div className="text-xs text-muted-foreground">
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
          <div className="pt-4 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Best Practices
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-foreground">
                    <strong className="text-emerald-800 dark:text-emerald-400">Good Example:</strong> 90% of reviews receive a personalized response within 24 hours; negative reviews are handled with an apology and a proposal to resolve the issue.
                  </div>
                </div>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-foreground">
                    <strong className="text-red-800 dark:text-red-400">Bad Example:</strong> Most reviews remain unanswered for weeks; there is no reaction to negative feedback at all.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calculation */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Calculation
            </h4>
            <p className="text-sm text-muted-foreground">
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
            <p className="text-sm text-muted-foreground mb-3">
              The number of times the clinic's profile appeared in search or on the map (Impressions), and the actions users took: website clicks, direction requests, calls, photo views, bookings.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Impressions/Month</div>
                <div className="text-lg font-bold text-foreground">
                  {result.gbp_engagement.impressions_per_month.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {result.gbp_engagement.search_impressions.toLocaleString()} search + {result.gbp_engagement.maps_impressions.toLocaleString()} maps
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Website Clicks</div>
                <div className="text-lg font-bold text-foreground">
                  {result.gbp_engagement.website_clicks_per_month.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Phone Calls</div>
                <div className="text-lg font-bold text-foreground">
                  {result.gbp_engagement.calls_per_month.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Direction Requests</div>
                <div className="text-lg font-bold text-foreground">
                  {result.gbp_engagement.direction_requests_per_month.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Click-Through Rate (CTR)</span>
                <span className={cn(
                  'text-2xl font-bold',
                  result.gbp_engagement.ctr_percent >= 5 ? 'text-emerald-600 dark:text-emerald-400' :
                  result.gbp_engagement.ctr_percent >= 1 ? 'text-orange-600 dark:text-orange-400' :
                  'text-red-600 dark:text-red-400'
                )}>
                  {result.gbp_engagement.ctr_percent.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Good/Bad Examples */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Best Practices
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-foreground">
                    <strong className="text-emerald-800 dark:text-emerald-400">Good Example:</strong> 10,000 impressions per month, 500 website clicks, 200 calls, 300 direction requests — CTR ~10%.
                  </div>
                </div>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-foreground">
                    <strong className="text-red-800 dark:text-red-400">Bad Example:</strong> 5,000 impressions, only 20 clicks, 5 calls — CTR &lt; 0.5%, indicating low relevance or an unattractive profile.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calculation */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Calculation
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
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
            <p className="text-sm text-muted-foreground mb-3">
              Links to the clinic's website from local sources: city portals, news sites, partners, medical associations, charity foundations, and local bloggers.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Total Backlinks</div>
                <div className="text-lg font-bold text-foreground">
                  {result.local_backlinks.total_local_backlinks}
                </div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Unique Domains</div>
                <div className="text-lg font-bold text-foreground">
                  {result.local_backlinks.unique_local_domains}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {result.local_backlinks.unique_local_domains >= 5 ? '✓ Good' : '< 5 is bad'}
                </div>
              </div>
            </div>

            {/* Backlinks by type */}
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                By Source Type
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">City Portals</div>
                  <div className="text-sm font-bold text-foreground">
                    {result.local_backlinks.backlinks_by_type.city_portals}
                  </div>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">News Sites</div>
                  <div className="text-sm font-bold text-foreground">
                    {result.local_backlinks.backlinks_by_type.news_sites}
                  </div>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Partners</div>
                  <div className="text-sm font-bold text-foreground">
                    {result.local_backlinks.backlinks_by_type.partners}
                  </div>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Associations</div>
                  <div className="text-sm font-bold text-foreground">
                    {result.local_backlinks.backlinks_by_type.medical_associations}
                  </div>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Charity</div>
                  <div className="text-sm font-bold text-foreground">
                    {result.local_backlinks.backlinks_by_type.charity_foundations}
                  </div>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Bloggers</div>
                  <div className="text-sm font-bold text-foreground">
                    {result.local_backlinks.backlinks_by_type.local_bloggers}
                  </div>
                </div>
              </div>
            </div>

            {/* Backlinks list */}
            {result.local_backlinks.backlinks.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Backlinks List
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {result.local_backlinks.backlinks.map((backlink, idx) => (
                    <div key={idx} className="p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">
                            {backlink.domain}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {backlink.url}
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-2 capitalize">
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
          <div className="pt-4 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Best Practices
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-foreground">
                    <strong className="text-emerald-800 dark:text-emerald-400">Good Example:</strong> 20 links from city portals, local media, partner clinics, and associations; all with relevant anchors and local context.
                  </div>
                </div>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-foreground">
                    <strong className="text-red-800 dark:text-red-400">Bad Example:</strong> No links from local sources; all backlinks are from general directories without any connection to the region.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Calculation */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Calculation
            </h4>
            <p className="text-sm text-muted-foreground">
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
            <p className="text-sm text-muted-foreground mb-3">
              Active clinic profiles on Facebook and Instagram with geotags, mentions of the city/district, posts about participation in local events, and interaction with the local audience.
            </p>
            
            {/* Facebook */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Facebook className="h-5 w-5 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">Facebook</h4>
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
                      className="text-sm text-primary hover:underline"
                    >
                      View Profile →
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Instagram */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Instagram className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                <h4 className="text-sm font-semibold text-foreground">Instagram</h4>
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
                      className="text-sm text-pink-600 dark:text-pink-400 hover:underline"
                    >
                      View Profile →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Calculation */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Calculation
            </h4>
            <p className="text-sm text-muted-foreground">
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
            <p className="text-sm text-muted-foreground mb-3">
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
                  <div className="text-sm text-muted-foreground">
                    <strong>Type:</strong> {result.local_business_schema.schema_type}
                  </div>
                </div>
              )}
            </div>

            {/* Required fields */}
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
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
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
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
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium text-foreground">Validation Status</span>
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
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : result.local_business_schema.validation_status === 'warning'
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
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
                <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3">
                  Errors
                </h4>
                <div className="space-y-1">
                  {result.local_business_schema.schema_errors.map((error, idx) => (
                    <div key={idx} className="text-sm text-red-600 dark:text-red-400">
                      • {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {result.local_business_schema.schema_warnings && result.local_business_schema.schema_warnings.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-3">
                  Warnings
                </h4>
                <div className="space-y-1">
                  {result.local_business_schema.schema_warnings.map((warning, idx) => (
                    <div key={idx} className="text-sm text-orange-600 dark:text-orange-400">
                      • {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Calculation */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Calculation
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Check if it is implemented</p>
              <p>• If yes, check if it is functioning correctly</p>
            </div>
          </div>
        </div>
      </MinimalMetricCard>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <Card className="border-2 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400 text-xl">
              <AlertTriangle className="h-6 w-6" />
              Recommendations ({result.recommendations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0">•</span>
                  <span className="text-foreground">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


