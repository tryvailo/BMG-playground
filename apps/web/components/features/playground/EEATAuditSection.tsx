'use client';

import React, { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  MapPin,
  Users,
  FileCheck,
  Briefcase,
  ChevronDown,
  ExternalLink,
  BookOpen,
  Award,
  AlertCircle,
  Info,
  Globe,
  Share2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell
} from 'recharts';
import { toast } from 'sonner';

import { Badge } from '@kit/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@kit/ui/collapsible';
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { cn } from '@kit/ui/utils';

import { runEEATAudit } from '~/lib/actions/eeat-audit';
import type { EEATAuditResult } from '~/lib/server/services/eeat/types';

// --- Premium 2026 Light Tokens ---
const TOKENS = {
    colors: {
        you: '#f43f5e', // Ruby
        c1: '#3b82f6', // Blue
        c2: '#8b5cf6', // Violet
        c3: '#10b981', // Emerald
        c4: '#f59e0b', // Amber
        c5: '#0ea5e9', // Sky
        c6: '#6366f1', // Indigo
        c7: '#d946ef', // Fuchsia
        c8: '#f97316', // Orange
        c9: '#14b8a6', // Teal
        c10: '#64748b', // Slate
        marketAvg: '#cbd5e1',
    },
    shadows: {
        soft: 'shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
        deep: 'shadow-[0_20px_50px_rgba(0,0,0,0.06)]',
    }
};

// --- Custom Modern Components ---
interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

const BentoCard = ({ children, className, title, subtitle }: BentoCardProps) => (
    <Card className={cn(
        "border border-slate-200 bg-white shadow-[0_8px_32px_0_rgba(15,23,42,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] group",
        className
    )}>
        {(title || subtitle) && (
            <CardHeader className="pb-2">
                {title && <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 group-hover:text-primary transition-colors">{title}</h3>}
                {subtitle && <p className="text-sm font-bold text-slate-900">{subtitle}</p>}
            </CardHeader>
        )}
        <CardContent className={cn("p-6", (title || subtitle) && "pt-2")}>
            {children}
        </CardContent>
    </Card>
);

interface EEATAuditSectionProps {
  /** Optional URL from parent context. If provided, will be used as default */
  defaultUrl?: string;
  /** Optional pre-computed result. If provided, will be displayed directly */
  result?: EEATAuditResult | null;
  className?: string;
}

/*
 * -------------------------------------------------------
 * Platform & Social Config
 * -------------------------------------------------------
 */

const PLATFORMS = [
  { key: 'Google Maps', icon: MapPin, color: 'emerald' },
  { key: 'Doc.ua', icon: ExternalLink, color: 'blue' },
  { key: 'Likarni', icon: ExternalLink, color: 'purple' },
  { key: 'Helsi', icon: ExternalLink, color: 'cyan' },
] as const;

const SOCIAL_NETWORKS = [
  { key: 'Facebook', color: 'blue' },
  { key: 'Instagram', color: 'pink' },
  { key: 'YouTube', color: 'red' },
] as const;

/*
 * -------------------------------------------------------
 * Helper Components
 * -------------------------------------------------------
 */

/**
 * Platform Badge Component
 * Shows green badge if found, gray if missing
 */
interface PlatformBadgeProps {
  name: string;
  found: boolean;
  icon?: React.ElementType;
}

function PlatformBadge({ name, found, icon: Icon }: PlatformBadgeProps) {
  return (
    <Badge
      variant={found ? 'default' : 'secondary'}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
        found
          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {found ? `${name} Linked` : `${name} Missing`}
    </Badge>
  );
}

/**
 * Count Badge Component
 * Shows a count with appropriate color styling
 */
interface CountBadgeProps {
  label: string;
  count: number;
  icon?: React.ElementType;
}

function _CountBadge({ label, count, icon: Icon }: CountBadgeProps) {
  const isGood = count > 0;
  return (
    <Badge
      variant={isGood ? 'default' : 'secondary'}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
        isGood
          ? 'bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:text-primary dark:hover:bg-primary/30'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}: {count}
    </Badge>
  );
}

/**
 * Checklist Item Component
 * Shows check or X icon based on status
 */
interface ChecklistItemProps {
  label: string;
  checked: boolean;
}

function ChecklistItem({ label, checked }: ChecklistItemProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      {checked ? (
        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
      ) : (
        <XCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
      )}
      <span
        className={cn(
          'text-sm font-medium',
          checked
            ? 'text-slate-900'
            : 'text-slate-600',
        )}
      >
        {label}
      </span>
    </div>
  );
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
    if (percentage < 50) return 'bg-red-600';
    if (percentage < 90) return 'bg-orange-500';
    return 'bg-emerald-600';
  };

  const heightClasses = {
    sm: 'h-2.5',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-bold text-slate-700">{label}</span>
          {showValue && (
            <span className="text-sm font-black text-slate-900">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className={cn('w-full bg-slate-200 rounded-full overflow-hidden relative border border-slate-300', heightClasses[size])}>
        <div
          className={cn('transition-all duration-500 ease-out rounded-full shadow-sm', getColor())}
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
  const [isOpen, setIsOpen] = useState(defaultOpen);

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
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case 'bad':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      default:
        return <Info className="h-5 w-5 text-slate-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return 'bg-emerald-50 border-emerald-300';
      case 'bad':
        return 'bg-red-50 border-red-300';
      case 'warning':
        return 'bg-orange-50 border-orange-300';
      default:
        return 'bg-white border-slate-200';
    }
  };

  return (
    <BentoCard className={cn('border-2', getStatusColor())}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {icon || getStatusIcon()}
                <CardTitle className="text-base font-bold text-slate-900">
                  {title}
                </CardTitle>
              </div>
              <div className="flex items-center gap-4">
                {calculatedScore !== null && calculatedScore !== undefined ? (
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-lg font-black italic',
                      calculatedScore >= 90 ? 'text-emerald-500' :
                        calculatedScore >= 50 ? 'text-orange-500' :
                          'text-rose-500'
                    )}>
                      {calculatedScore}
                    </span>
                    <span className="text-sm text-slate-500">/100</span>
                  </div>
                ) : null}
                {value && (
                  <span className="text-base font-bold text-slate-900">
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
              <div className="mt-3">
                <ProgressBar value={calculatedScore} size="sm" showValue={false} />
              </div>
            ) : (
              <div className="mt-3 h-2.5 w-full bg-slate-100 rounded-full border border-slate-200" />
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
    </BentoCard>
  );
}

/**
 * Category Section Component
 */
interface CategorySectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function _CategorySection({ title, icon, children }: CategorySectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        {icon}
        <h2 className="text-xl font-black text-slate-900">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {children}
      </div>
    </div>
  );
}

/**
 * Calculate Overall Score for E-E-A-T
 */
function calculateOverallScore(data: EEATAuditResult): number {
  const scores: number[] = [];

  // Experience scores
  if (data.experience.has_case_studies) scores.push(100);
  if (data.experience.experience_figures_found) scores.push(100);
  if (data.experience.case_study_structure) {
    scores.push(data.experience.case_study_structure.completeness_score);
  }

  // Expertise scores
  if (data.authorship.metrics) {
    scores.push(data.authorship.metrics.blog_pages_with_author_percent);
    scores.push(data.authorship.metrics.authors_with_credentials_percent);
  } else {
    if (data.authorship.has_author_blocks) scores.push(100);
    if (data.authorship.author_credentials_found) scores.push(100);
  }
  if (data.authorship.author_profile) {
    const profileChecks = [
      data.authorship.author_profile.has_qualifications,
      data.authorship.author_profile.has_position,
      data.authorship.author_profile.has_experience_years,
      data.authorship.author_profile.has_credentials_links,
    ];
    scores.push((profileChecks.filter(Boolean).length / 4) * 100);
  }

  // Authoritativeness scores
  if (data.authority.scientific_metrics?.articles_with_sources_percent !== undefined) {
    scores.push(data.authority.scientific_metrics.articles_with_sources_percent);
  } else if (data.authority.scientific_sources_count > 0) {
    scores.push(Math.min(100, data.authority.scientific_sources_count * 20));
  }
  if (data.authority.has_community_mentions) scores.push(100);
  if (data.authority.media_links && data.authority.media_links.length > 0) scores.push(100);
  if (data.authority.publications && data.authority.publications.length > 0) scores.push(100);
  if (data.authority.association_memberships && data.authority.association_memberships.length > 0) scores.push(100);

  // Trustworthiness scores
  if (data.trust.has_privacy_policy) scores.push(100);
  if (data.trust.has_licenses) scores.push(100);
  if (data.trust.contact_page_found) scores.push(100);
  if (data.trust.nap_present) scores.push(100);
  if (data.trust.nap_comparison && data.trust.nap_comparison.match_percent !== undefined) {
    scores.push(data.trust.nap_comparison.match_percent);
  }
  if (data.trust.legal_entity?.has_legal_entity_name) scores.push(100);
  if (data.trust.about_us?.has_about_us_link) scores.push(100);
  if (data.trust.contact_block) {
    const contactChecks = [
      data.trust.contact_block.has_email,
      data.trust.contact_block.has_booking_form,
      data.trust.contact_block.has_map,
    ];
    scores.push((contactChecks.filter(Boolean).length / 3) * 100);
  }

  // Reputation scores
  if (data.reputation.google_maps_rating?.fetched && data.reputation.google_maps_rating.rating) {
    scores.push((data.reputation.google_maps_rating.rating / 5) * 100);
  }
  if (data.reputation.average_rating?.average_rating) {
    scores.push((data.reputation.average_rating.average_rating / 5) * 100);
  }
  const totalPlatforms = data.reputation.linked_platforms.length + data.reputation.social_links.length;
  if (totalPlatforms > 0) scores.push(Math.min(100, totalPlatforms * 20));

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * Calculate Category Scores for E-E-A-T
 */
function calculateCategoryScores(data: EEATAuditResult) {
  const experienceScores: number[] = [];
  const expertiseScores: number[] = [];
  const authorityScores: number[] = [];
  const trustScores: number[] = [];

  // Experience
  if (data.experience.has_case_studies) experienceScores.push(100);
  if (data.experience.experience_figures_found) experienceScores.push(100);
  if (data.experience.case_study_structure) {
    experienceScores.push(data.experience.case_study_structure.completeness_score);
  }

  // Expertise
  if (data.authorship.metrics) {
    expertiseScores.push(data.authorship.metrics.blog_pages_with_author_percent);
    expertiseScores.push(data.authorship.metrics.authors_with_credentials_percent);
  } else {
    if (data.authorship.has_author_blocks) expertiseScores.push(100);
    if (data.authorship.author_credentials_found) expertiseScores.push(100);
  }
  if (data.authorship.author_profile) {
    const profileChecks = [
      data.authorship.author_profile.has_qualifications,
      data.authorship.author_profile.has_position,
      data.authorship.author_profile.has_experience_years,
      data.authorship.author_profile.has_credentials_links,
    ];
    expertiseScores.push((profileChecks.filter(Boolean).length / 4) * 100);
  }

  // Authoritativeness
  if (data.authority.scientific_metrics?.articles_with_sources_percent !== undefined) {
    authorityScores.push(data.authority.scientific_metrics.articles_with_sources_percent);
  } else if (data.authority.scientific_sources_count > 0) {
    authorityScores.push(Math.min(100, data.authority.scientific_sources_count * 20));
  }
  if (data.authority.has_community_mentions) authorityScores.push(100);
  if (data.authority.media_links && data.authority.media_links.length > 0) authorityScores.push(100);
  if (data.authority.publications && data.authority.publications.length > 0) authorityScores.push(100);
  if (data.authority.association_memberships && data.authority.association_memberships.length > 0) authorityScores.push(100);

  // Trustworthiness
  if (data.trust.has_privacy_policy) trustScores.push(100);
  if (data.trust.has_licenses) trustScores.push(100);
  if (data.trust.contact_page_found) trustScores.push(100);
  if (data.trust.nap_present) trustScores.push(100);
  if (data.trust.nap_comparison && data.trust.nap_comparison.match_percent !== undefined) {
    trustScores.push(data.trust.nap_comparison.match_percent);
  }
  if (data.trust.legal_entity?.has_legal_entity_name) trustScores.push(100);
  if (data.trust.about_us?.has_about_us_link) trustScores.push(100);
  if (data.trust.contact_block) {
    const contactChecks = [
      data.trust.contact_block.has_email,
      data.trust.contact_block.has_booking_form,
      data.trust.contact_block.has_map,
    ];
    trustScores.push((contactChecks.filter(Boolean).length / 3) * 100);
  }
  if (data.reputation.google_maps_rating?.fetched && data.reputation.google_maps_rating.rating) {
    trustScores.push((data.reputation.google_maps_rating.rating / 5) * 100);
  }
  if (data.reputation.average_rating?.average_rating) {
    trustScores.push((data.reputation.average_rating.average_rating / 5) * 100);
  }
  const totalPlatforms = data.reputation.linked_platforms.length + data.reputation.social_links.length;
  if (totalPlatforms > 0) trustScores.push(Math.min(100, totalPlatforms * 20));

  return {
    experience: experienceScores.length > 0
      ? Math.round(experienceScores.reduce((a, b) => a + b, 0) / experienceScores.length)
      : null,
    expertise: expertiseScores.length > 0
      ? Math.round(expertiseScores.reduce((a, b) => a + b, 0) / expertiseScores.length)
      : null,
    authority: authorityScores.length > 0
      ? Math.round(authorityScores.reduce((a, b) => a + b, 0) / authorityScores.length)
      : null,
    trust: trustScores.length > 0
      ? Math.round(trustScores.reduce((a, b) => a + b, 0) / trustScores.length)
      : null,
  };
}

/*
 * -------------------------------------------------------
 * Main Component
 * -------------------------------------------------------
 */

export function EEATAuditSection({
  defaultUrl,
  result: externalResult,
  className,
}: EEATAuditSectionProps) {
  const t = useTranslations('Playground.eeatAudit');
  const [url, setUrl] = useState(defaultUrl || '');
  const [internalResult, setInternalResult] = useState<EEATAuditResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [multiPage] = useState(false);
  const [filterType] = useState<'blog' | 'doctors' | 'articles' | 'all'>('all');

  // Use external result if provided, otherwise use internal result
  const result = externalResult !== undefined ? externalResult : internalResult;

  // Update URL when defaultUrl changes
  React.useEffect(() => {
    if (defaultUrl) {
      setUrl(defaultUrl);
    }
  }, [defaultUrl]);

  const _handleAnalyze = () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    setError(null);
    setInternalResult(null);

    startTransition(async () => {
      try {
        const auditResult = await runEEATAudit({
          url: url.trim(),
          multiPage,
          filterType,
          maxPages: 50,
        });
        setInternalResult(auditResult);
        toast.success(
          multiPage
            ? 'E-E-A-T multi-page audit completed successfully!'
            : 'E-E-A-T audit completed successfully!',
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        toast.error(`E-E-A-T audit failed: ${errorMessage}`);
      }
    });
  };

  if (!result) {
    return null;
  }

  const overallScore = calculateOverallScore(result);
  const categoryScores = calculateCategoryScores(result);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 50) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-50 border-emerald-300';
    if (score >= 50) return 'bg-orange-50 border-orange-300';
    return 'bg-red-50 border-red-300';
  };

  // Prepare Trust Signals data for Bar Chart
  const trustSignalsData = [
    {
      name: 'Privacy Policy',
      value: result.trust.has_privacy_policy ? 100 : 0,
      status: result.trust.has_privacy_policy ? 'good' : 'bad',
    },
    {
      name: 'Licenses',
      value: result.trust.has_licenses ? 100 : 0,
      status: result.trust.has_licenses ? 'good' : 'bad',
    },
    {
      name: 'Contact Page',
      value: result.trust.contact_page_found ? 100 : 0,
      status: result.trust.contact_page_found ? 'good' : 'bad',
    },
    {
      name: 'NAP Present',
      value: result.trust.nap_present ? 100 : 0,
      status: result.trust.nap_present ? 'good' : 'bad',
    },
    {
      name: 'Legal Entity',
      value: result.trust.legal_entity?.has_legal_entity_name ? 100 : 0,
      status: result.trust.legal_entity?.has_legal_entity_name ? 'good' : 'bad',
    },
    {
      name: 'About Us',
      value: result.trust.about_us?.has_about_us_link ? 100 : 0,
      status: result.trust.about_us?.has_about_us_link ? 'good' : 'bad',
    },
    {
      name: 'Contact Block',
      value: result.trust.contact_block ? 
        ((result.trust.contact_block.has_email ? 1 : 0) + 
         (result.trust.contact_block.has_booking_form ? 1 : 0) + 
         (result.trust.contact_block.has_map ? 1 : 0)) / 3 * 100 : 0,
      status: result.trust.contact_block ? 
        ((result.trust.contact_block.has_email && result.trust.contact_block.has_booking_form && result.trust.contact_block.has_map) ? 'good' : 'warning') : 'bad',
    },
  ];

  // Calculate status for each category
  const _getReputationStatus = () => {
    if (!result) return 'neutral';
    const totalSignals =
      result.reputation.linked_platforms.length +
      result.reputation.social_links.length;
    if (totalSignals >= 3) return 'good';
    if (totalSignals >= 1) return 'warning';
    return 'bad';
  };

  const _getTrustStatus = () => {
    if (!result) return 'neutral';
    const checks = [
      result.trust.has_privacy_policy,
      result.trust.has_licenses,
      result.trust.contact_page_found,
      result.trust.nap_present,
    ];
    const passed = checks.filter(Boolean).length;
    if (passed >= 3) return 'good';
    if (passed >= 1) return 'warning';
    return 'bad';
  };

  const _getAuthorityStatus = () => {
    if (!result) return 'neutral';
    const hasScientific = result.authority.scientific_sources_count > 0;
    const hasCommunity = result.authority.has_community_mentions;
    if (hasScientific && hasCommunity) return 'good';
    if (hasScientific || hasCommunity) return 'warning';
    return 'bad';
  };

  const _getExpertiseStatus = () => {
    if (!result) return 'neutral';
    const checks = [
      result.authorship.has_author_blocks,
      result.authorship.author_credentials_found,
      result.experience.has_case_studies,
      result.experience.experience_figures_found,
    ];
    const passed = checks.filter(Boolean).length;
    if (passed >= 3) return 'good';
    if (passed >= 1) return 'warning';
    return 'bad';
  };

  return (
    <div className={cn('space-y-8', className)}>


      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isPending && (
        <BentoCard className="border-2 border-emerald-300 bg-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              E-E-A-T Assessment in Progress
            </CardTitle>
            <CardDescription className="text-slate-600">
              Scanning for authorship, trust, authority, reputation, and
              experience signals...
            </CardDescription>
          </CardHeader>
        </BentoCard>
      )}

      {/* Results */}
      {result && !isPending && (
        <>
          {/* Hero Section */}
          <BentoCard className={cn('border-2 relative overflow-hidden bg-white', getScoreBgColor(overallScore))}>
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
              <Shield className="w-24 h-24" />
            </div>
            <CardHeader>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 mb-2">
                    {t('title')}
                  </h1>
                  <p className="text-sm font-medium text-slate-700">
                    {t('description')}
                  </p>
                </div>
                <div className="text-center">
                  <div className={cn('text-5xl font-black italic tracking-tighter mb-1', getScoreColor(overallScore))}>
                    {overallScore}
                  </div>
                  <div className="text-sm font-bold text-slate-600">
                    / 100
                  </div>
                </div>
              </div>

              {/* Category Progress Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                {categoryScores.experience !== null && (
                  <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('groups.experience')}</span>
                      <span className="text-xs font-black text-slate-900">{categoryScores.experience}%</span>
                    </div>
                    <ProgressBar value={categoryScores.experience} size="md" showValue={false} />
                  </div>
                )}
                {categoryScores.expertise !== null && (
                  <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('groups.expertise')}</span>
                      <span className="text-xs font-black text-slate-900">{categoryScores.expertise}%</span>
                    </div>
                    <ProgressBar value={categoryScores.expertise} size="md" showValue={false} />
                  </div>
                )}
                {categoryScores.authority !== null && (
                  <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('groups.authority')}</span>
                      <span className="text-xs font-black text-slate-900">{categoryScores.authority}%</span>
                    </div>
                    <ProgressBar value={categoryScores.authority} size="md" showValue={false} />
                  </div>
                )}
                {categoryScores.trust !== null && (
                  <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{t('groups.trust')}</span>
                      <span className="text-xs font-black text-slate-900">{categoryScores.trust}%</span>
                    </div>
                    <ProgressBar value={categoryScores.trust} size="md" showValue={false} />
                  </div>
                )}
              </div>
            </CardHeader>
          </BentoCard>

          {/* Trust Signals Breakdown Bar Chart */}
          <BentoCard title="Trust Signals Breakdown" subtitle="Key trust indicators and their status">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={trustSignalsData} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    type="number"
                    domain={[0, 100]}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px 12px',
                    }}
                    formatter={(value: number) => [`${value}%`, 'Status']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {trustSignalsData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.status === 'good' ? TOKENS.colors.c3 :
                          entry.status === 'warning' ? TOKENS.colors.c4 :
                          TOKENS.colors.you
                        } 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {trustSignalsData.map((signal, idx) => (
                <div key={idx} className="p-3 bg-slate-50/50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">{signal.name}</span>
                    {signal.status === 'good' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : signal.status === 'warning' ? (
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                    <div
                      className={cn(
                        'h-full transition-all duration-500 ease-out rounded-full',
                        signal.status === 'good' ? 'bg-emerald-600' :
                        signal.status === 'warning' ? 'bg-orange-500' :
                        'bg-red-600'
                      )}
                      style={{ width: `${signal.value}%`, minWidth: signal.value > 0 ? '4px' : '0' }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{signal.value}%</div>
                </div>
              ))}
            </div>
          </BentoCard>

          {/* 5.1. Content Authors */}
          <MinimalMetricCard
            title={t('items.5_1.title')}
            icon={<Users className="h-5 w-5" />}
            status={
              result.authorship.metrics
                ? result.authorship.metrics.blog_pages_with_author_percent >= 80 &&
                  result.authorship.metrics.authors_with_credentials_percent >= 80
                  ? 'good'
                  : result.authorship.metrics.blog_pages_with_author_percent >= 50 ||
                    result.authorship.metrics.authors_with_credentials_percent >= 50
                    ? 'warning'
                    : 'bad'
                : result.authorship.has_author_blocks && result.authorship.author_credentials_found
                  ? 'good'
                  : result.authorship.has_author_blocks || result.authorship.author_credentials_found
                    ? 'warning'
                    : 'bad'
            }
            score={
              result.authorship.metrics
                ? Math.round((result.authorship.metrics.blog_pages_with_author_percent + result.authorship.metrics.authors_with_credentials_percent) / 2)
                : result.authorship.has_author_blocks && result.authorship.author_credentials_found
                  ? 100
                  : result.authorship.has_author_blocks || result.authorship.author_credentials_found
                    ? 50
                    : 0
            }
            value={
              result.authorship.metrics
                ? `${result.authorship.metrics.blog_pages_with_author_percent.toFixed(0)}% articles`
                : result.authorship.has_author_blocks
                  ? 'Author blocks found'
                  : 'No authors'
            }
          >
            <div className="space-y-4">
              {/* Calculation Metrics */}
              {result.authorship.metrics ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-200">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Blog pages with medical author
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {result.authorship.metrics.articles_with_author} of{' '}
                          {result.authorship.metrics.total_articles} articles
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black italic text-slate-900">
                          {result.authorship.metrics.blog_pages_with_author_percent.toFixed(1)}%
                        </div>
                        <Badge
                          variant={
                            result.authorship.metrics.blog_pages_with_author_percent >= 80
                              ? 'default'
                              : result.authorship.metrics.blog_pages_with_author_percent >= 50
                                ? 'secondary'
                                : 'destructive'
                          }
                          className={
                            result.authorship.metrics.blog_pages_with_author_percent >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : result.authorship.metrics.blog_pages_with_author_percent >= 50
                                ? 'bg-orange-100 text-orange-800'
                                : ''
                          }
                        >
                          {result.authorship.metrics.blog_pages_with_author_percent >= 80
                            ? 'Good'
                            : result.authorship.metrics.blog_pages_with_author_percent >= 50
                              ? 'Needs improvement'
                              : 'Poor'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-200">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Authors with verified credentials
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Diploma, certificates, association memberships
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black italic text-slate-900">
                          {result.authorship.metrics.authors_with_credentials_percent.toFixed(1)}%
                        </div>
                        <Badge
                          variant={
                            result.authorship.metrics.authors_with_credentials_percent >= 80
                              ? 'default'
                              : result.authorship.metrics.authors_with_credentials_percent >= 50
                                ? 'secondary'
                                : 'destructive'
                          }
                          className={
                            result.authorship.metrics.authors_with_credentials_percent >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : result.authorship.metrics.authors_with_credentials_percent >= 50
                                ? 'bg-orange-100 text-orange-800'
                                : ''
                          }
                        >
                          {result.authorship.metrics.authors_with_credentials_percent >= 80
                            ? 'Good'
                            : result.authorship.metrics.authors_with_credentials_percent >= 50
                              ? 'Needs improvement'
                              : 'Poor'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Good/Bad Examples */}
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                      Best Practices
                    </h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-slate-700">
                            <strong className="text-emerald-600">Good Example:</strong> All
                            treatment articles contain a block: "Author: Cardiologist, PhD, Member of
                            [Association]" with a link to their profile page.
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100">
                        <div className="flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-slate-700">
                            <strong className="text-rose-600">Bad Example:</strong> Clinic
                            blog without author names, listed only as "Site Editorial Team," with no data
                            on education or experience.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Single Page Analysis */}
                  <div className="space-y-3">
                    <ChecklistItem
                      label="Author blocks present"
                      checked={result.authorship.has_author_blocks}
                    />
                    <ChecklistItem
                      label="Author credentials found (diploma, certificates, associations)"
                      checked={result.authorship.author_credentials_found}
                    />
                    {result.authorship.article_author && (
                      <>
                        <ChecklistItem
                          label="Article identified"
                          checked={result.authorship.article_author.is_article}
                        />
                        <ChecklistItem
                          label="Author block on article"
                          checked={result.authorship.article_author.has_author_block}
                        />
                        {result.authorship.article_author.author_name && (
                          <div className="pl-8 text-xs text-muted-foreground">
                            Author: {result.authorship.article_author.author_name}
                          </div>
                        )}
                        <ChecklistItem
                          label="Link to author profile"
                          checked={result.authorship.article_author.has_author_profile_link}
                        />
                      </>
                    )}
                    {result.authorship.author_profile && (
                      <>
                        <ChecklistItem
                          label="Qualifications mentioned (Dr., MD, PhD, к.м.н.)"
                          checked={result.authorship.author_profile.has_qualifications}
                        />
                        <ChecklistItem
                          label="Position/title mentioned"
                          checked={result.authorship.author_profile.has_position}
                        />
                        <ChecklistItem
                          label="Years of experience mentioned"
                          checked={result.authorship.author_profile.has_experience_years}
                        />
                        <ChecklistItem
                          label="Links to diplomas/certificates"
                          checked={result.authorship.author_profile.has_credentials_links}
                        />
                      </>
                    )}
                  </div>

                  {/* Good/Bad Examples */}
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                      Best Practices
                    </h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-slate-700">
                            <strong className="text-emerald-600">Good Example:</strong> All
                            treatment articles contain a block: &quot;Author: Cardiologist, PhD, Member of
                            [Association]&quot; with a link to their profile page.
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100">
                        <div className="flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                          <div className="text-xs text-slate-700">
                            <strong className="text-rose-600">Bad Example:</strong> Clinic
                            blog without author names, listed only as &quot;Site Editorial Team,&quot; with no data
                            on education or experience.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </MinimalMetricCard>

          {/* 5.2. Doctor Profiles */}
          <MinimalMetricCard
            title={t('items.5_2.title')}
            icon={<Award className="h-5 w-5" />}
            status={
              result.authorship.author_profile
                ? result.authorship.author_profile.has_qualifications &&
                  result.authorship.author_profile.has_credentials_links
                  ? 'good'
                  : result.authorship.author_profile.has_qualifications ||
                    result.authorship.author_profile.has_credentials_links
                    ? 'warning'
                    : 'bad'
                : 'bad'
            }
            score={
              result.authorship.author_profile
                ? (([
                  result.authorship.author_profile.has_qualifications,
                  result.authorship.author_profile.has_position,
                  result.authorship.author_profile.has_experience_years,
                  result.authorship.author_profile.has_credentials_links,
                ].filter(Boolean).length /
                  4) *
                  100)
                : 0
            }
            value={
              result.authorship.author_profile
                ? result.authorship.author_profile.has_qualifications
                  ? 'Profile with credentials'
                  : 'Basic profile'
                : 'Profile missing'
            }
          >
            <div className="space-y-4">
              {/* Multi-page Metrics */}
              {result.analysis_scope === 'multi_page' && result.multi_page_metrics?.doctor_expertise_metrics ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-200">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Doctor pages with verified credentials
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {result.multi_page_metrics.doctor_expertise_metrics.doctor_pages_with_credentials || 0} of{' '}
                          {result.multi_page_metrics.doctor_expertise_metrics.total_doctor_pages || 0} doctor pages
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black italic text-slate-900">
                          {result.multi_page_metrics.doctor_expertise_metrics.doctor_pages_with_credentials_percent?.toFixed(1) || 0}%
                        </div>
                        <Badge
                          variant={
                            (result.multi_page_metrics.doctor_expertise_metrics.doctor_pages_with_credentials_percent || 0) >= 80
                              ? 'default'
                              : (result.multi_page_metrics.doctor_expertise_metrics.doctor_pages_with_credentials_percent || 0) >= 50
                                ? 'secondary'
                                : 'destructive'
                          }
                          className={
                            (result.multi_page_metrics.doctor_expertise_metrics.doctor_pages_with_credentials_percent || 0) >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : (result.multi_page_metrics.doctor_expertise_metrics.doctor_pages_with_credentials_percent || 0) >= 50
                                ? 'bg-orange-100 text-orange-800'
                                : ''
                          }
                        >
                          {(result.multi_page_metrics.doctor_expertise_metrics.doctor_pages_with_credentials_percent || 0) >= 80
                            ? 'Good'
                            : (result.multi_page_metrics.doctor_expertise_metrics.doctor_pages_with_credentials_percent || 0) >= 50
                              ? 'Needs improvement'
                              : 'Poor'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                      Calculation
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      % of doctor pages with verified medical credentials = (doctor pages with credentials) / (total doctor pages) × 100
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Single Page Analysis */}
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500 mb-3">
                      The experience and expertise of doctors must be confirmed by their years of work, completion of courses, education, etc.
                    </p>

                    {result.authorship.author_profile ? (
                      <>
                        <ChecklistItem
                          label="Qualifications mentioned (Dr., MD, PhD, к.м.н.)"
                          checked={result.authorship.author_profile.has_qualifications}
                        />
                        <ChecklistItem
                          label="Position/title mentioned"
                          checked={result.authorship.author_profile.has_position}
                        />
                        <ChecklistItem
                          label="Years of experience mentioned"
                          checked={result.authorship.author_profile.has_experience_years}
                        />
                        <ChecklistItem
                          label="Links to diplomas/certificates"
                          checked={result.authorship.author_profile.has_credentials_links}
                        />
                      </>
                    ) : (
                      <>
                        <ChecklistItem
                          label="Author credentials found"
                          checked={result.authorship.author_credentials_found}
                        />
                        <p className="text-sm text-muted-foreground italic pl-8">
                          This page does not appear to be a doctor profile page. For multi-page analysis, enable "Multi-page Analysis" and select "Doctors Only" filter.
                        </p>
                      </>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                      Calculation
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      % of doctor pages with verified medical credentials (diplomas, certificates, association memberships).
                    </p>
                    <p className="text-sm text-muted-foreground italic mt-2">
                      For accurate calculation, use multi-page analysis with &quot;Doctors Only&quot; filter.
                    </p>
                  </div>
                </>
              )}
            </div>
          </MinimalMetricCard>

          {/* 5.5. Case Studies & Results */}
          <MinimalMetricCard
            title={t('items.5_5.title')}
            icon={<Briefcase className="h-5 w-5" />}
            status={
              result.experience.has_case_studies && result.experience.experience_figures_found
                ? 'good'
                : result.experience.has_case_studies || result.experience.experience_figures_found
                  ? 'warning'
                  : 'bad'
            }
            score={
              result.experience.has_case_studies && result.experience.experience_figures_found
                ? 100
                : result.experience.has_case_studies || result.experience.experience_figures_found
                  ? 50
                  : 0
            }
            value={
              result.experience.has_case_studies && result.experience.experience_figures_found
                ? 'Cases + Figures'
                : result.experience.has_case_studies
                  ? 'Cases found'
                  : result.experience.experience_figures_found
                    ? 'Figures found'
                    : 'No data'
            }
          >
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-3">
                  Demonstration of real cases, years of operation, and patient volume in specific areas.
                </p>

                <ChecklistItem
                  label="Case studies / Patient stories present"
                  checked={result.experience.has_case_studies}
                />
                <ChecklistItem
                  label="Experience figures found (years, patient volume)"
                  checked={result.experience.experience_figures_found}
                />

                {/* Case Study Structure Details */}
                {result.experience.case_study_structure && (
                  <div className="pl-8 pt-2 space-y-2">
                    <div className="text-sm text-slate-500">
                      <strong>Case Study Structure:</strong>
                    </div>
                    <div className="space-y-1">
                      <ChecklistItem
                        label="Complaint/Symptoms"
                        checked={result.experience.case_study_structure.has_complaint}
                      />
                      <ChecklistItem
                        label="Diagnosis"
                        checked={result.experience.case_study_structure.has_diagnosis}
                      />
                      <ChecklistItem
                        label="Treatment Plan"
                        checked={result.experience.case_study_structure.has_treatment}
                      />
                      <ChecklistItem
                        label="Results/Outcome"
                        checked={result.experience.case_study_structure.has_result}
                      />
                      <ChecklistItem
                        label="Timeline"
                        checked={result.experience.case_study_structure.has_timeline}
                      />
                    </div>
                  </div>
                )}

                {/* PII Compliance */}
                {result.experience.pii_compliance && (
                  <div className="pl-8 pt-2">
                    <div className="text-sm text-muted-foreground mb-2">
                      <strong>Privacy Compliance:</strong>
                    </div>
                    <ChecklistItem
                      label="No personal identifying information (PII)"
                      checked={
                        result.experience.pii_compliance.is_compliant &&
                        result.experience.pii_compliance.names_anonymized &&
                        result.experience.pii_compliance.addresses_absent &&
                        result.experience.pii_compliance.phones_absent
                      }
                    />
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
                        <strong className="text-emerald-600">Good Example:</strong> &quot;Laser Vision
                        Correction&quot; page featuring data: &quot;15 years of experience, 5000+ surgeries.&quot;
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong className="text-rose-600">Bad Example:</strong> Generic text like &quot;We
                        are a professional clinic,&quot; without specifics or figures regarding experience.
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
                  Presence of cases/patient stories describing the treatment process (without violating confidentiality).
                </p>
              </div>
            </div>
          </MinimalMetricCard>

          {/* 5.9. External Ratings */}
          <MinimalMetricCard
            title={t('items.5_9.title')}
            icon={<MapPin className="h-5 w-5" />}
            status={
              result.reputation.google_maps_rating?.fetched &&
                result.reputation.google_maps_rating.rating &&
                result.reputation.google_maps_rating.rating >= 4.7 &&
                (result.reputation.google_maps_rating.review_count || 0) >= 200
                ? 'good'
                : result.reputation.google_maps_rating?.fetched &&
                  result.reputation.google_maps_rating.rating &&
                  result.reputation.google_maps_rating.rating >= 4.0
                  ? 'warning'
                  : result.reputation.google_maps_rating?.fetched
                    ? 'bad'
                    : result.reputation.linked_platforms.length > 0 || result.reputation.social_links.length > 0
                      ? 'warning'
                      : 'bad'
            }
            score={
              result.reputation.google_maps_rating?.fetched && result.reputation.google_maps_rating.rating
                ? Math.round((result.reputation.google_maps_rating.rating / 5) * 100)
                : result.reputation.average_rating?.average_rating
                  ? Math.round((result.reputation.average_rating.average_rating / 5) * 100)
                  : result.reputation.linked_platforms.length > 0 || result.reputation.social_links.length > 0
                    ? 50
                    : 0
            }
            value={
              result.reputation.google_maps_rating?.fetched && result.reputation.google_maps_rating.rating
                ? `${result.reputation.google_maps_rating.rating.toFixed(1)}★ (${result.reputation.google_maps_rating.review_count?.toLocaleString() || 0} reviews)`
                : result.reputation.average_rating?.average_rating
                  ? `${result.reputation.average_rating.average_rating.toFixed(1)}★ avg`
                  : `${result.reputation.linked_platforms.length + result.reputation.social_links.length} links`
            }
          >
            <div className="space-y-4">
              {/* Google Maps Rating */}
              {result.reputation.google_maps_rating?.fetched && (
                <div className="pb-4 border-b border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Google Maps Rating
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold text-foreground">
                        {result.reputation.google_maps_rating.rating?.toFixed(1)}
                      </span>
                      <span className="text-lg text-yellow-500">★</span>
                    </div>
                    <div className="text-sm text-slate-500">
                      {result.reputation.google_maps_rating.review_count?.toLocaleString() || 0}{' '}
                      reviews
                    </div>
                  </div>
                </div>
              )}

              {/* Average Rating */}
              {result.reputation.average_rating && (
                <div className="pb-4 border-b border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Average Rating
                  </h4>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold text-foreground">
                        {result.reputation.average_rating.average_rating?.toFixed(1)}
                      </span>
                      <span className="text-lg text-yellow-500">★</span>
                    </div>
                    <div className="text-sm text-slate-500">
                      {result.reputation.average_rating.total_reviews?.toLocaleString() || 0} total
                      reviews across {result.reputation.average_rating.platforms_count} platform(s)
                    </div>
                  </div>
                </div>
              )}

              {/* Platform Links */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  External Platforms
                </h4>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(({ key, icon }) => (
                    <PlatformBadge
                      key={key}
                      name={key}
                      found={result.reputation.linked_platforms.includes(key)}
                      icon={icon}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: If the clinic is not listed on an aggregator, this does not lower the average score.
                </p>
              </div>

              {/* Social Links */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Social Media
                </h4>
                <div className="flex flex-wrap gap-2">
                  {SOCIAL_NETWORKS.map(({ key }) => (
                    <PlatformBadge
                      key={key}
                      name={key}
                      found={result.reputation.social_links.includes(key)}
                    />
                  ))}
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
                        <strong className="text-emerald-600">Good Example:</strong> 4.7+ stars on
                        Google Maps with 200+ reviews and positive sentiment.
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong className="text-rose-600">Bad Example:</strong> 3.0 stars, few reviews,
                        aggressive responses, or lack of responses to complaints.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metric Description */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Metric
                </h4>
                <p className="text-sm text-muted-foreground">
                  Average star rating on major platforms: Google Maps, doc.ua, Likarni.com, and their sentiment.
                </p>
              </div>
            </div>
          </MinimalMetricCard>

          {/* 5.5. Patient Stories (Case Studies) */}
          <MinimalMetricCard
            title="Patient Stories (Case Studies)"
            icon={<FileCheck className="h-5 w-5" />}
            status={
              result.experience.case_study_structure &&
                result.experience.case_study_structure.completeness_score >= 80 &&
                result.experience.pii_compliance?.is_compliant
                ? 'good'
                : result.experience.has_case_studies &&
                  result.experience.case_study_structure &&
                  result.experience.case_study_structure.completeness_score >= 50
                  ? 'warning'
                  : result.experience.has_case_studies
                    ? 'warning'
                    : 'bad'
            }
            score={
              result.experience.case_study_structure
                ? result.experience.case_study_structure.completeness_score
                : result.experience.has_case_studies
                  ? 50
                  : 0
            }
            value={
              result.experience.case_study_structure
                ? `${result.experience.case_study_structure.completeness_score}% complete`
                : result.experience.has_case_studies
                  ? 'Cases found'
                  : 'No cases'
            }
          >
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-3">
                  The presence of real patient stories (case studies) showing the treatment path: complaint → diagnosis → treatment → result. This reinforces the Experience and Trust components by demonstrating actual results while maintaining anonymity and ethical norms.
                </p>

                <ChecklistItem
                  label="Case studies / Patient stories present"
                  checked={result.experience.has_case_studies}
                />

                {/* Case Study Structure */}
                {result.experience.case_study_structure ? (
                  <>
                    <div className="pl-8 pt-2 space-y-2">
                      <div className="text-sm text-slate-500">
                        <strong>Case Study Structure:</strong>
                      </div>
                      <div className="space-y-1">
                        <ChecklistItem
                          label="Complaint/Symptoms"
                          checked={result.experience.case_study_structure.has_complaint}
                        />
                        <ChecklistItem
                          label="Diagnosis"
                          checked={result.experience.case_study_structure.has_diagnosis}
                        />
                        <ChecklistItem
                          label="Treatment Plan"
                          checked={result.experience.case_study_structure.has_treatment}
                        />
                        <ChecklistItem
                          label="Results/Outcome"
                          checked={result.experience.case_study_structure.has_result}
                        />
                        <ChecklistItem
                          label="Timeline"
                          checked={result.experience.case_study_structure.has_timeline}
                        />
                        <ChecklistItem
                          label="Metrics (before/after)"
                          checked={result.experience.case_study_structure.has_metrics}
                        />
                        <ChecklistItem
                          label="Doctor Commentary"
                          checked={result.experience.case_study_structure.has_doctor_commentary}
                        />
                      </div>
                      <div className="pt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Structure Completeness:</span>
                          <Badge
                            variant={
                              result.experience.case_study_structure.completeness_score >= 80
                                ? 'default'
                                : result.experience.case_study_structure.completeness_score >= 50
                                  ? 'secondary'
                                  : 'destructive'
                            }
                            className={
                              result.experience.case_study_structure.completeness_score >= 80
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : result.experience.case_study_structure.completeness_score >= 50
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                  : ''
                            }
                          >
                            {result.experience.case_study_structure.completeness_score}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}

                {/* Case Studies by Specialty */}
                {result.experience.case_studies_by_specialty &&
                  result.experience.case_studies_by_specialty.length > 0 && (
                    <div className="pl-8 pt-2">
                      <div className="text-sm text-muted-foreground mb-2">
                        <strong>Cases by Specialty:</strong>
                      </div>
                      <div className="space-y-1">
                        {result.experience.case_studies_by_specialty.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{item.specialty}:</span>
                            <Badge variant="secondary" className="text-xs">
                              {item.count} {item.count === 1 ? 'case' : 'cases'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* PII Compliance */}
                {result.experience.pii_compliance && (
                  <div className="pl-8 pt-2">
                    <div className="text-sm text-muted-foreground mb-2">
                      <strong>Privacy & Ethics Compliance:</strong>
                    </div>
                    <ChecklistItem
                      label="No personal identifying information (PII)"
                      checked={result.experience.pii_compliance.is_compliant}
                    />
                    {result.experience.pii_compliance.is_compliant && (
                      <div className="pl-8 space-y-1 mt-1">
                        <ChecklistItem
                          label="Names anonymized"
                          checked={result.experience.pii_compliance.names_anonymized}
                        />
                        <ChecklistItem
                          label="Addresses absent"
                          checked={result.experience.pii_compliance.addresses_absent}
                        />
                        <ChecklistItem
                          label="Phone numbers absent"
                          checked={result.experience.pii_compliance.phones_absent}
                        />
                      </div>
                    )}
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
                        <strong className="text-emerald-600">Good Example:</strong> On the &quot;Chronic
                        Gastritis Treatment&quot; page, there is a separate &quot;Patient Story&quot; block: a concise description of
                        the situation before the visit, the examination, the prescribed treatment, the condition dynamics
                        over 3 months, and the result (without PII/identifying data); added doctor's commentary on
                        tactic selection.
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong className="text-rose-600">Bad Example:</strong> Vague text like &quot;We
                        have many patients we cured&quot; without specific stories, treatment stages, timelines, or metrics;
                        OR publication of a story with full personal patient data without consent.
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
                  <p>• Presence of published cases overall and for main specialties (Cardiology, Dentistry, etc.).</p>
                  <p>
                    • Presence of a structured case template (complaint, diagnosis, treatment, result, timeline),
                    rather than just a "they helped me" review.
                  </p>
                </div>
              </div>
            </div>
          </MinimalMetricCard>

          {/* 5.3. Scientific Sources */}
          <MinimalMetricCard
            title={t('items.5_3.title')}
            icon={<BookOpen className="h-5 w-5" />}
            status={
              result.authority.scientific_metrics
                ? (result.authority.scientific_metrics.articles_with_sources_percent || 0) >= 70
                  ? 'good'
                  : (result.authority.scientific_metrics.articles_with_sources_percent || 0) >= 50
                    ? 'warning'
                    : 'bad'
                : result.authority.scientific_sources_count > 0
                  ? 'warning'
                  : 'bad'
            }
            score={
              result.authority.scientific_metrics
                ? result.authority.scientific_metrics.articles_with_sources_percent || 0
                : result.authority.scientific_sources_count > 0
                  ? Math.min(100, result.authority.scientific_sources_count * 20)
                  : 0
            }
            value={
              result.authority.scientific_metrics
                ? `${(result.authority.scientific_metrics.articles_with_sources_percent || 0).toFixed(0)}% articles`
                : `${result.authority.scientific_sources_count} sources`
            }
          >
            <div className="space-y-4">
              {/* Multi-page Metrics */}
              {result.authority.scientific_metrics ? (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-200">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Articles with scientific sources
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {result.authority.scientific_metrics.articles_with_sources} of{' '}
                          {result.authority.scientific_metrics.total_articles} articles
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black italic text-slate-900">
                          {(result.authority.scientific_metrics.articles_with_sources_percent || 0).toFixed(1)}%
                        </div>
                        <Badge
                          variant={
                            (result.authority.scientific_metrics.articles_with_sources_percent || 0) >= 70
                              ? 'default'
                              : (result.authority.scientific_metrics.articles_with_sources_percent || 0) >= 50
                                ? 'secondary'
                                : 'destructive'
                          }
                          className={
                            (result.authority.scientific_metrics.articles_with_sources_percent || 0) >= 70
                              ? 'bg-emerald-100 text-emerald-800'
                              : (result.authority.scientific_metrics.articles_with_sources_percent || 0) >= 50
                                ? 'bg-orange-100 text-orange-800'
                                : ''
                          }
                        >
                          {(result.authority.scientific_metrics.articles_with_sources_percent || 0) >= 70
                            ? 'Good'
                            : (result.authority.scientific_metrics.articles_with_sources_percent || 0) >= 50
                              ? 'Needs improvement'
                              : 'Poor'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Single Page Analysis */}
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500 mb-3">
                      Medical articles are supported by references to clinical studies, national, and international
                      protocols.
                    </p>

                    <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-200">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          Scientific Sources Found
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Links to PubMed, WHO, Cochrane, MOZ.gov.ua, NCBI
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black italic text-slate-900">
                          {result.authority.scientific_sources_count}
                        </div>
                        <Badge
                          variant={result.authority.scientific_sources_count > 0 ? 'default' : 'secondary'}
                          className={
                            result.authority.scientific_sources_count > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : ''
                          }
                        >
                          {result.authority.scientific_sources_count > 0 ? 'Found' : 'None'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Good/Bad Examples */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                  Best Practices
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-900/30">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong className="text-emerald-600">Good Example:</strong> An article on
                        diabetes treatment with links to clinical guidelines and journal publications.
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong className="text-rose-600">Bad Example:</strong> Categorical medical
                        advice without a single source or mention of protocols.
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
                  % of medical articles with links to authoritative sources.
                </p>
              </div>
            </div>
          </MinimalMetricCard>

          {/* 5.4. Social Proof / Community Interaction */}
          <MinimalMetricCard
            title={t('items.5_4.title')}
            icon={<Share2 className="h-5 w-5" />}
            status={
              (result.authority.media_links && result.authority.media_links.length > 0) ||
                (result.authority.publications && result.authority.publications.length > 0) ||
                (result.authority.association_memberships && result.authority.association_memberships.length > 0)
                ? 'good'
                : result.authority.has_community_mentions
                  ? 'warning'
                  : 'bad'
            }
            score={
              [
                result.authority.media_links?.length || 0,
                result.authority.publications?.length || 0,
                result.authority.association_memberships?.length || 0,
              ].reduce((a, b) => a + b, 0) > 0
                ? 100
                : result.authority.has_community_mentions
                  ? 50
                  : 0
            }
            value={
              [
                result.authority.media_links?.length || 0,
                result.authority.publications?.length || 0,
                result.authority.association_memberships?.length || 0,
              ].reduce((a, b) => a + b, 0) > 0
                ? `${[
                  result.authority.media_links?.length || 0,
                  result.authority.publications?.length || 0,
                  result.authority.association_memberships?.length || 0,
                ].reduce((a, b) => a + b, 0)} mentions`
                : result.authority.has_community_mentions
                  ? 'Mentions found'
                  : 'No mentions'
            }
          >
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-3">
                Participation in conferences, publications in professional journals, membership in associations, and mentions in authoritative medical media.
              </p>

              {/* Media Links */}
              {result.authority.media_links && result.authority.media_links.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Media Mentions
                  </h4>
                  <div className="space-y-2">
                    {result.authority.media_links.map((link, idx) => (
                      <div key={idx} className="p-2 bg-muted/50 rounded-lg">
                        <a
                          href={typeof link === 'string' ? link : link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline break-all"
                        >
                          {typeof link === 'string' ? link : (link.name || link.url)}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Publications */}
              {result.authority.publications && result.authority.publications.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Publications
                  </h4>
                  <div className="space-y-2">
                    {result.authority.publications.map((pub, idx) => (
                      <div key={idx} className="p-2 bg-muted/50 rounded-lg">
                        <p className="text-sm text-foreground">
                          {typeof pub === 'string' ? pub : (pub.title || pub.url)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Association Memberships */}
              {result.authority.association_memberships && result.authority.association_memberships.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Association Memberships
                  </h4>
                  <div className="space-y-2">
                    {result.authority.association_memberships.map((membership, idx) => (
                      <div key={idx} className="p-2 bg-muted/50 rounded-lg">
                        <p className="text-sm text-foreground">
                          {typeof membership === 'string' ? membership : membership.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Single Page Analysis Fallback */}
              {(!result.authority.media_links || result.authority.media_links.length === 0) &&
                (!result.authority.publications || result.authority.publications.length === 0) &&
                (!result.authority.association_memberships || result.authority.association_memberships.length === 0) && (
                  <div className="space-y-3">
                    <ChecklistItem
                      label="Community mentions found (conferences, speeches, interviews, media)"
                      checked={result.authority.has_community_mentions}
                    />
                    <p className="text-sm text-muted-foreground italic pl-8">
                      For detailed analysis, use multi-page analysis to discover all mentions across the site.
                    </p>
                  </div>
                )}

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
                        <strong className="text-emerald-600">Good Example:</strong> The site has an &quot;About Us&quot; block or section listing doctors&apos; speeches and publications.
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong className="text-rose-600">Bad Example:</strong> The clinic positions itself as a &quot;leading center&quot; but has no verifiable mentions in professional sources.
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
                  Verification of outbound links from the clinic's site to external mentions of the clinic/doctors in professional media.
                </p>
              </div>
            </div>
          </MinimalMetricCard>

          {/* 5.10. Feedback */}
          <MinimalMetricCard
            title={t('items.5_10.title')}
            icon={<Globe className="h-5 w-5" />}
            status={
              result.trust.nap_comparison &&
                result.trust.nap_comparison.match_percent !== undefined &&
                result.trust.nap_comparison.match_percent >= 80
                ? 'good'
                : result.trust.nap_present && result.trust.nap_data
                  ? 'warning'
                  : 'bad'
            }
            score={
              result.trust.nap_comparison && result.trust.nap_comparison.match_percent !== undefined
                ? result.trust.nap_comparison.match_percent
                : result.trust.nap_present
                  ? 50
                  : 0
            }
            value={
              result.trust.nap_comparison && result.trust.nap_comparison.match_percent !== undefined
                ? `${result.trust.nap_comparison.match_percent}% match`
                : result.trust.nap_present
                  ? 'NAP present'
                  : 'No NAP'
            }
          >
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground mb-3">
                  Consistent data about the clinic (Name, Address, Phone) across local medical catalogs and maps.
                </p>

                <ChecklistItem label="NAP data present on website" checked={result.trust.nap_present} />

                {/* NAP Data Details */}
                {result.trust.nap_data && (
                  <div className="pl-8 pt-2 space-y-1 text-xs text-muted-foreground">
                    {result.trust.nap_data.name && (
                      <p>
                        <strong>Name:</strong> {result.trust.nap_data.name}
                      </p>
                    )}
                    {result.trust.nap_data.address && (
                      <p>
                        <strong>Address:</strong> {result.trust.nap_data.address}
                      </p>
                    )}
                    {result.trust.nap_data.phone && (
                      <p>
                        <strong>Phone:</strong> {result.trust.nap_data.phone}
                      </p>
                    )}
                  </div>
                )}

                {/* NAP Comparison */}
                {result.trust.nap_comparison && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg border border-slate-200">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          NAP Consistency Match
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Website vs Google Business Profile
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black italic text-slate-900">
                          {result.trust.nap_comparison.match_percent?.toFixed(0) || 0}%
                        </div>
                        <Badge
                          variant={
                            (result.trust.nap_comparison.match_percent || 0) >= 80
                              ? 'default'
                              : (result.trust.nap_comparison.match_percent || 0) >= 50
                                ? 'secondary'
                                : 'destructive'
                          }
                          className={
                            (result.trust.nap_comparison.match_percent || 0) >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : (result.trust.nap_comparison.match_percent || 0) >= 50
                                ? 'bg-orange-100 text-orange-800'
                                : ''
                          }
                        >
                          {(result.trust.nap_comparison.match_percent || 0) >= 80
                            ? 'Good'
                            : (result.trust.nap_comparison.match_percent || 0) >= 50
                              ? 'Needs improvement'
                              : 'Poor'}
                        </Badge>
                      </div>
                    </div>

                    <div className="pl-8 pt-2 space-y-1">
                      <ChecklistItem
                        label="Name matches"
                        checked={result.trust.nap_comparison.name_matches === true}
                      />
                      <ChecklistItem
                        label="Address matches"
                        checked={result.trust.nap_comparison.address_matches === true}
                      />
                      <ChecklistItem
                        label="Phone matches"
                        checked={result.trust.nap_comparison.phone_matches === true}
                      />
                    </div>

                    {result.trust.nap_comparison.google_business && (
                      <div className="pl-8 pt-2 mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                        <p className="font-medium mb-1">Google Business Profile:</p>
                        {result.trust.nap_comparison.google_business.name && (
                          <p>Name: {result.trust.nap_comparison.google_business.name}</p>
                        )}
                        {result.trust.nap_comparison.google_business.address && (
                          <p>Address: {result.trust.nap_comparison.google_business.address}</p>
                        )}
                        {result.trust.nap_comparison.google_business.phone && (
                          <p>Phone: {result.trust.nap_comparison.google_business.phone}</p>
                        )}
                      </div>
                    )}
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
                        <strong className="text-emerald-600">Good Example:</strong> Identical NAP
                        data on the website, Google Profile, and specialized city medical directories.
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong className="text-rose-600">Bad Example:</strong> Different phone
                        numbers/addresses in the catalog, on the site, and on the map; multiple duplicate listings for
                        one clinic.
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
                <p className="text-xs text-muted-foreground">
                  % of NAP matches between the website, Google Business Profile, and major catalogs.
                </p>
              </div>
            </div>
          </MinimalMetricCard>

          {/* 5.6. Legal Transparency */}
          <MinimalMetricCard
            title={t('items.5_6.title')}
            icon={<Shield className="h-5 w-5" />}
            status={
              result.trust.legal_entity?.has_legal_entity_name &&
                result.trust.about_us?.has_about_us_link &&
                result.trust.contact_block &&
                (result.trust.contact_block.has_email || result.trust.contact_block.has_booking_form)
                ? 'good'
                : (result.trust.legal_entity?.has_legal_entity_name ||
                  result.trust.about_us?.has_about_us_link ||
                  result.trust.contact_block) &&
                  result.trust.contact_page_found
                  ? 'warning'
                  : 'bad'
            }
            score={
              Math.round(([
                result.trust.legal_entity?.has_legal_entity_name,
                result.trust.about_us?.has_about_us_link,
                result.trust.contact_block?.has_email || result.trust.contact_block?.has_booking_form,
                result.trust.contact_page_found,
              ].filter(Boolean).length / 4) * 100)
            }
            value={
              [
                result.trust.legal_entity?.has_legal_entity_name,
                result.trust.about_us?.has_about_us_link,
                result.trust.contact_block?.has_email || result.trust.contact_block?.has_booking_form,
                result.trust.contact_page_found,
              ].filter(Boolean).length + '/4'
            }
          >
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground mb-3">
                  The website clearly indicates who the owner/legal entity is, where the clinic is located, how to make
                  contact, and what departments exist.
                </p>

                {/* Legal Entity */}
                <ChecklistItem
                  label="Legal entity information present"
                  checked={result.trust.legal_entity?.has_legal_entity_name === true}
                />
                {result.trust.legal_entity?.legal_entity_name && (
                  <div className="pl-8 text-xs text-muted-foreground">
                    Entity: {result.trust.legal_entity.legal_entity_name}
                  </div>
                )}
                {result.trust.legal_entity?.has_registration_number && (
                  <div className="pl-8 text-xs text-muted-foreground">
                    Registration number (ЕДРПОУ) found
                  </div>
                )}

                {/* About Us Page */}
                <ChecklistItem
                  label="About the Clinic page"
                  checked={result.trust.about_us?.has_about_us_link === true}
                />
                {result.trust.about_us && (
                  <div className="pl-8 space-y-1">
                    <ChecklistItem
                      label="Clinic history mentioned"
                      checked={result.trust.about_us.has_clinic_history}
                    />
                    <ChecklistItem
                      label="Mission/values mentioned"
                      checked={result.trust.about_us.has_mission_values}
                    />
                    <ChecklistItem
                      label="Team information present"
                      checked={result.trust.about_us.has_team_info}
                    />
                  </div>
                )}

                {/* Contact Block */}
                <ChecklistItem
                  label="Full contacts block present"
                  checked={
                    (result.trust.contact_block?.has_email || result.trust.contact_block?.has_booking_form) === true
                  }
                />
                {result.trust.contact_block && (
                  <div className="pl-8 space-y-1">
                    <ChecklistItem
                      label="Email address"
                      checked={result.trust.contact_block.has_email}
                    />
                    {result.trust.contact_block.email && (
                      <div className="pl-8 text-xs text-muted-foreground">
                        {result.trust.contact_block.email}
                      </div>
                    )}
                    <ChecklistItem
                      label="Booking form"
                      checked={result.trust.contact_block.has_booking_form}
                    />
                    <ChecklistItem label="Map embedded" checked={result.trust.contact_block.has_map} />
                  </div>
                )}

                {/* Contact Page */}
                <ChecklistItem label="Contact page link" checked={result.trust.contact_page_found} />

                {/* Departments */}
                {result.trust.departments && result.trust.departments.length > 0 && (
                  <div className="pt-2">
                    <div className="text-xs text-muted-foreground mb-2">
                      <strong>Departments ({result.trust.departments.length}):</strong>
                    </div>
                    <div className="space-y-1">
                      {result.trust.departments.map((dept, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span className="text-muted-foreground">{dept.name}</span>
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
                        <strong className="text-emerald-600">Good Example:</strong> An &quot;About Us&quot;
                        section with the legal entity name, address, licenses, phone numbers, email, booking form, and
                        map.
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-foreground">
                        <strong className="text-rose-600">Bad Example:</strong> Only a feedback form
                        without an address, phone number, or legal entity data.
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
                <p className="text-xs text-muted-foreground">
                  Presence/Absence of a full contacts block, legal information, and an "About the Clinic" page.
                </p>
              </div>
            </div>
          </MinimalMetricCard>

          {/* 5.7. Medical Licenses */}
          <MinimalMetricCard
            title={t('items.5_7.title')}
            icon={<Award className="h-5 w-5" />}
            status={result.trust.has_licenses ? 'good' : 'bad'}
            value={result.trust.has_licenses ? 'Licenses found' : 'No licenses'}
          >
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground mb-3">
                  The user sees under which medical license/accreditation the clinic and doctors operate.
                </p>

                <ChecklistItem
                  label="License information present"
                  checked={result.trust.has_licenses}
                />

                {!result.trust.has_licenses && (
                  <p className="text-xs text-muted-foreground italic pl-8">
                    No license information found. Look for dedicated license section or license information within other
                    sections.
                  </p>
                )}
              </div>

              {/* Requirement */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Requirement
                </h4>
                <p className="text-xs text-muted-foreground">
                  Presence of a section with licenses or license information within another section.
                </p>
              </div>
            </div>
          </MinimalMetricCard>

          {/* 5.8. Privacy Policy */}
          <MinimalMetricCard
            title={t('items.5_8.title')}
            icon={<Shield className="h-5 w-5" />}
            status={result.trust.has_privacy_policy ? 'good' : 'bad'}
            value={result.trust.has_privacy_policy ? 'Policy found' : 'No policy'}
          >
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-3">
                  Clearly described privacy policy, method of medical data processing, and consent for processing.
                </p>

                <ChecklistItem
                  label="Privacy/Terms page present"
                  checked={result.trust.has_privacy_policy}
                />

                {!result.trust.has_privacy_policy && (
                  <p className="text-sm text-muted-foreground italic pl-8">
                    No privacy policy page found. Look for links to /privacy, /policy, /terms, or text "Політика конфіденційності".
                  </p>
                )}
              </div>

              {/* Calculation */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Calculation
                </h4>
                <p className="text-sm text-muted-foreground">
                  Presence of Privacy/Terms pages describing data handling.
                </p>
              </div>
            </div>
          </MinimalMetricCard>

          {/* 5.11. Relevance and Regularity */}
          <MinimalMetricCard
            title={t('items.5_11.title')}
            icon={<Info className="h-5 w-5" />}
            status={result.analyzed_pages_count && result.analyzed_pages_count > 5 ? 'good' : 'warning'}
            value={result.analyzed_pages_count ? `${result.analyzed_pages_count} pages analyzed` : 'Manual check needed'}
          >
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-3">
                  Verification of content relevance and regularity of medical information updates.
                </p>
                <ChecklistItem
                  label="Content appeared recently updated"
                  checked={true}
                />
                <p className="text-xs text-muted-foreground italic pl-8">
                  Check for "Last Updated" dates on medical articles and the frequency of new blog posts.
                </p>
              </div>
            </div>
          </MinimalMetricCard>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <BentoCard className="border-2 border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600 text-xl font-black italic">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                  Recommendations ({result.recommendations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-orange-500 mt-0.5 flex-shrink-0">•</span>
                      <span className="text-slate-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </BentoCard>
          )}
        </>
      )}
    </div>
  );
}
