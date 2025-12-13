'use client';

import React, { useState, useTransition } from 'react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Link2,
  Phone,
  MapPin,
  HelpCircle,
  ChevronDown,
  Settings,
  Info,
  AlertCircle,
  Type,
  Layout,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@kit/ui/collapsible';
import { cn } from '@kit/ui/utils';
import { performContentAudit } from '~/lib/actions/content-audit';
import type { ContentAuditResult } from '~/lib/server/services/content/types';

interface ContentAuditSectionProps {
  /** Optional URL from parent context. If provided, will be used as default */
  defaultUrl?: string;
  /** Optional pre-computed result. If provided, will be displayed directly */
  result?: ContentAuditResult | null;
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
 * Category Section Component
 */
interface CategorySectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function CategorySection({ title, icon, children }: CategorySectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-border">
        {icon}
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {children}
      </div>
    </div>
  );
}

/**
 * Calculate Overall Score
 */
function calculateOverallScore(data: ContentAuditResult): number {
  const scores: number[] = [];

  // Text Quality scores (inverted for wateriness - lower is better)
  scores.push(100 - data.text_quality.wateriness_score); // Invert: 0% wateriness = 100 score
  scores.push(data.text_quality.uniqueness_score);

  // Structure score
  scores.push(data.structure.architecture_score);

  // Authority scores (boolean to score)
  if (data.authority.has_valid_phone) scores.push(100);
  if (data.authority.has_valid_address) scores.push(100);
  if (data.authority.authority_links_count > 0) scores.push(Math.min(100, data.authority.authority_links_count * 20)); // 1 link = 20, 5+ = 100
  if (data.authority.faq_count >= 3) scores.push(100);
  else if (data.authority.faq_count > 0) scores.push(50);

  // Structure pages (boolean to score)
  if (data.structure.has_doctor_pages) scores.push(100);
  if (data.structure.has_service_pages) scores.push(100);
  if (data.structure.has_department_pages) scores.push(100);
  if (data.structure.has_blog) scores.push(100);

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * Calculate Category Scores
 */
function calculateCategoryScores(data: ContentAuditResult) {
  const textQualityScores: number[] = [];
  const structureScores: number[] = [];
  const authorityScores: number[] = [];

  // Text Quality
  textQualityScores.push(100 - data.text_quality.wateriness_score); // Invert wateriness
  textQualityScores.push(data.text_quality.uniqueness_score);

  // Structure
  structureScores.push(data.structure.architecture_score);
  if (data.structure.has_doctor_pages) structureScores.push(100);
  if (data.structure.has_service_pages) structureScores.push(100);
  if (data.structure.has_department_pages) structureScores.push(100);
  if (data.structure.has_blog) structureScores.push(100);

  // Authority
  if (data.authority.has_valid_phone) authorityScores.push(100);
  if (data.authority.has_valid_address) authorityScores.push(100);
  if (data.authority.authority_links_count > 0) {
    authorityScores.push(Math.min(100, data.authority.authority_links_count * 20));
  }
  if (data.authority.faq_count >= 3) authorityScores.push(100);
  else if (data.authority.faq_count > 0) authorityScores.push(50);

  return {
    textQuality: textQualityScores.length > 0
      ? Math.round(textQualityScores.reduce((a, b) => a + b, 0) / textQualityScores.length)
      : null,
    structure: structureScores.length > 0
      ? Math.round(structureScores.reduce((a, b) => a + b, 0) / structureScores.length)
      : null,
    authority: authorityScores.length > 0
      ? Math.round(authorityScores.reduce((a, b) => a + b, 0) / authorityScores.length)
      : null,
  };
}

export function ContentAuditSection({ defaultUrl, result: externalResult, className }: ContentAuditSectionProps) {
  const [url, setUrl] = useState(defaultUrl || '');
  const [internalResult, setInternalResult] = useState<ContentAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Use external result if provided, otherwise use internal result
  const result = externalResult !== undefined ? externalResult : internalResult;

  // Update URL when defaultUrl changes
  React.useEffect(() => {
    if (defaultUrl) {
      setUrl(defaultUrl);
    }
  }, [defaultUrl]);

  const handleAnalyze = () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    setError(null);
    setInternalResult(null);

    startTransition(async () => {
      try {
        const auditResult = await performContentAudit({ url: url.trim() });
        setInternalResult(auditResult);
        toast.success('Content audit completed successfully!');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        toast.error(`Content audit failed: ${errorMessage}`);
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
    if (score >= 90) return 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800';
    if (score >= 50) return 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800';
    return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
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
        <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Content Optimization Audit in Progress
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* Results */}
      {result && !isPending && (
        <>
          {/* Hero Section */}
          <Card className={cn('border-2', getScoreBgColor(overallScore))}>
            <CardHeader>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground mb-2">
                    Content Optimization Results
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Overall assessment of your website's content quality and structure
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
                {categoryScores.textQuality !== null && (
                  <ProgressBar 
                    value={categoryScores.textQuality} 
                    label="Text Quality" 
                    size="md"
                  />
                )}
                {categoryScores.structure !== null && (
                  <ProgressBar 
                    value={categoryScores.structure} 
                    label="Site Structure" 
                    size="md"
                  />
                )}
                {categoryScores.authority !== null && (
                  <ProgressBar 
                    value={categoryScores.authority} 
                    label="Authority & Trust" 
                    size="md"
                  />
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Text Quality Category */}
          <CategorySection 
            title="Text Quality" 
            icon={<Type className="h-6 w-6 text-primary" />}
          >
            <MinimalMetricCard
              title="Text Wateriness"
              icon={<FileText className="h-5 w-5" />}
              status={result.text_quality.wateriness_score < 25 ? 'good' : 'bad'}
              score={100 - result.text_quality.wateriness_score}
              value={`${result.text_quality.wateriness_score.toFixed(1)}%`}
            >
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <p>
                    <strong className="text-foreground">Target:</strong> &lt; 25% is considered good. Lower wateriness indicates more meaningful content.
                  </p>
                  <p>
                    <strong className="text-foreground">Current:</strong> {result.text_quality.wateriness_score.toFixed(1)}%
                    {result.text_quality.wateriness_score >= 25 && (
                      <span className="text-orange-600 dark:text-orange-400 ml-2">
                        ⚠️ Above recommended threshold
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </MinimalMetricCard>

            <MinimalMetricCard
              title="Content Uniqueness"
              icon={<FileText className="h-5 w-5" />}
              status={result.text_quality.uniqueness_score >= 90 ? 'good' : result.text_quality.uniqueness_score >= 70 ? 'warning' : 'bad'}
              score={result.text_quality.uniqueness_score}
              value={`${result.text_quality.uniqueness_score.toFixed(1)}%`}
            >
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <p>
                    <strong className="text-foreground">Target:</strong> &gt; 90% is considered excellent. Higher uniqueness reduces duplicate content penalties.
                  </p>
                  <p>
                    <strong className="text-foreground">Current:</strong> {result.text_quality.uniqueness_score.toFixed(1)}%
                    {result.text_quality.uniqueness_score < 90 && (
                      <span className="text-orange-600 dark:text-orange-400 ml-2">
                        ⚠️ Below recommended threshold
                      </span>
                    )}
                  </p>
                  <p className="text-muted-foreground italic mt-2">
                    Note: Currently using mock data. Integration with Copyleaks API pending.
                  </p>
                </div>
              </div>
            </MinimalMetricCard>
          </CategorySection>

          {/* Site Structure Category */}
          <CategorySection 
            title="Site Structure" 
            icon={<Layout className="h-6 w-6 text-primary" />}
          >
            <MinimalMetricCard
              title="Site Architecture"
              icon={<Settings className="h-5 w-5" />}
              status={result.structure.architecture_score >= 70 ? 'good' : result.structure.architecture_score >= 50 ? 'warning' : 'bad'}
              score={result.structure.architecture_score}
              value={`${result.structure.architecture_score}/100`}
            >
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="space-y-2">
                  <p>
                    <strong className="text-foreground">Score:</strong> {result.structure.architecture_score}/100
                  </p>
                  <p>
                    <strong className="text-foreground">Evaluation:</strong> Based on navigation depth, internal linking structure, and content organization.
                  </p>
                  <p>
                    Higher scores indicate better site structure and user navigation.
                  </p>
                </div>
              </div>
            </MinimalMetricCard>

            <MinimalMetricCard
              title="Doctor Pages"
              icon={<FileText className="h-5 w-5" />}
              status={result.structure.has_doctor_pages ? 'good' : 'bad'}
              value={result.structure.has_doctor_pages ? 'Found' : 'Missing'}
            >
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Status:</strong> {result.structure.has_doctor_pages ? 'Doctor pages detected' : 'Doctor pages not found'}
                </p>
                <p>
                  Doctor pages help establish expertise and authority for medical professionals on your website.
                </p>
              </div>
            </MinimalMetricCard>

            <MinimalMetricCard
              title="Service Pages"
              icon={<FileText className="h-5 w-5" />}
              status={result.structure.has_service_pages ? 'good' : 'bad'}
              value={result.structure.has_service_pages ? 'Found' : 'Missing'}
            >
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Status:</strong> {result.structure.has_service_pages ? 'Service pages detected' : 'Service pages not found'}
                </p>
                <p>
                  Service pages help users understand what medical services you offer.
                </p>
              </div>
            </MinimalMetricCard>

            <MinimalMetricCard
              title="Department Pages"
              icon={<FileText className="h-5 w-5" />}
              status={result.structure.has_department_pages ? 'good' : 'bad'}
              value={result.structure.has_department_pages ? 'Found' : 'Missing'}
            >
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Status:</strong> {result.structure.has_department_pages ? 'Department pages detected' : 'Department pages not found'}
                </p>
                <p>
                  Department pages organize medical services by specialty and improve site structure.
                </p>
              </div>
            </MinimalMetricCard>

            <MinimalMetricCard
              title="Blog Presence"
              icon={<FileText className="h-5 w-5" />}
              status={result.structure.has_blog ? 'good' : 'bad'}
              value={result.structure.has_blog ? 'Found' : 'Missing'}
            >
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Status:</strong> {result.structure.has_blog ? 'Blog section detected' : 'Blog section not found'}
                </p>
                <p>
                  A blog helps demonstrate expertise, improve SEO, and engage with your audience.
                </p>
              </div>
            </MinimalMetricCard>
          </CategorySection>

          {/* Authority & Trust Category */}
          <CategorySection 
            title="Authority & Trust" 
            icon={<Shield className="h-6 w-6 text-primary" />}
          >
            <MinimalMetricCard
              title="Authority Links"
              icon={<Link2 className="h-5 w-5" />}
              status={result.authority.authority_links_count > 0 ? 'good' : 'bad'}
              value={result.authority.authority_links_count > 0 ? `${result.authority.authority_links_count}` : 'None'}
              score={result.authority.authority_links_count > 0 ? Math.min(100, result.authority.authority_links_count * 20) : 0}
            >
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Count:</strong> {result.authority.authority_links_count} trusted domain{result.authority.authority_links_count !== 1 ? 's' : ''}
                </p>
                <p>
                  <strong className="text-foreground">Trusted Sources:</strong> WHO, NIH, CDC, medical associations, educational institutions (.edu.ua, .gov.ua)
                </p>
                <p>
                  Links to authoritative medical sources improve E-E-A-T signals.
                </p>
              </div>
            </MinimalMetricCard>

            <MinimalMetricCard
              title="Valid Phone"
              icon={<Phone className="h-5 w-5" />}
              status={result.authority.has_valid_phone ? 'good' : 'bad'}
              value={result.authority.has_valid_phone ? 'Found' : 'Missing'}
            >
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Status:</strong> {result.authority.has_valid_phone ? 'Phone number detected (tel: link or pattern match)' : 'Phone number not found'}
                </p>
                <p>
                  Phone number is part of NAP (Name, Address, Phone) data important for local SEO.
                </p>
              </div>
            </MinimalMetricCard>

            <MinimalMetricCard
              title="Valid Address"
              icon={<MapPin className="h-5 w-5" />}
              status={result.authority.has_valid_address ? 'good' : 'bad'}
              value={result.authority.has_valid_address ? 'Found' : 'Missing'}
            >
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Status:</strong> {result.authority.has_valid_address ? 'Address detected (city + street pattern)' : 'Address not found'}
                </p>
                <p>
                  Physical address is part of NAP (Name, Address, Phone) data important for local SEO.
                </p>
              </div>
            </MinimalMetricCard>

            <MinimalMetricCard
              title="FAQ Items"
              icon={<HelpCircle className="h-5 w-5" />}
              status={result.authority.faq_count >= 3 ? 'good' : result.authority.faq_count > 0 ? 'warning' : 'bad'}
              value={result.authority.faq_count > 0 ? `${result.authority.faq_count}` : 'None'}
              score={result.authority.faq_count >= 3 ? 100 : result.authority.faq_count > 0 ? 50 : 0}
            >
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Count:</strong> {result.authority.faq_count} item{result.authority.faq_count !== 1 ? 's' : ''} found
                  {result.authority.faq_count >= 3 ? ' (Good)' : result.authority.faq_count > 0 ? ' (Minimum 3 recommended)' : ' (Not found)'}
                </p>
                <p>
                  FAQ sections help answer common questions and can display rich snippets in search results.
                </p>
              </div>
            </MinimalMetricCard>
          </CategorySection>

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
        </>
      )}
    </div>
  );
}
