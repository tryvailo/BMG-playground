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
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
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
 * Circle Gauge Component (same as TechAuditSection)
 * Displays a score (0-100) in a circular progress indicator
 */
interface CircleGaugeProps {
  score: number | null;
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

function CircleGauge({ score, label, size = 'md' }: CircleGaugeProps) {
  const value = score ?? 0;
  const clampedValue = Math.max(0, Math.min(100, value));
  const percentage = clampedValue / 100;
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - percentage);

  // Color based on score
  const getColor = () => {
    if (clampedValue < 50) return 'text-red-600 dark:text-red-400';
    if (clampedValue < 90) return 'text-orange-600 dark:text-orange-400';
    return 'text-emerald-600 dark:text-emerald-400';
  };

  const getStrokeColor = () => {
    if (clampedValue < 50) return 'stroke-red-600 dark:stroke-red-400';
    if (clampedValue < 90) return 'stroke-orange-600 dark:stroke-orange-400';
    return 'stroke-emerald-600 dark:stroke-emerald-400';
  };

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-28 h-28',
    lg: 'w-36 h-36',
  };

  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  if (score === null) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className={cn('flex items-center justify-center rounded-full border-2 border-slate-300 dark:border-slate-600', sizeClasses[size])}>
          <span className="text-slate-400 dark:text-slate-500 text-xs">N/A</span>
        </div>
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium text-center">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: sizeClasses[size], height: sizeClasses[size] }}>
        <svg
          className="transform -rotate-90"
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-200 dark:text-slate-700"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="8"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={getStrokeColor()}
            style={{
              transition: 'stroke-dashoffset 0.5s ease-in-out',
            }}
          />
        </svg>
        {/* Score text in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', getColor(), textSizeClasses[size])}>
            {Math.round(clampedValue)}
          </span>
        </div>
      </div>
      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium text-center">{label}</span>
    </div>
  );
}

/**
 * Minimal Metric Card Component (same as TechAuditSection)
 * Displays a metric in a compact card with icon and expandable details
 */
interface MinimalMetricCardProps {
  title: string;
  icon?: React.ReactNode;
  status: 'good' | 'bad' | 'warning' | 'neutral';
  value?: string | number | React.ReactNode;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

function MinimalMetricCard({ 
  title, 
  icon, 
  status, 
  value, 
  children, 
  defaultOpen = false 
}: MinimalMetricCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const getStatusIcon = () => {
    switch (status) {
      case 'good':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />;
      case 'bad':
        return <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
      default:
        return <Info className="h-5 w-5 text-slate-400 dark:text-slate-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return 'border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10';
      case 'bad':
        return 'border-l-red-500 bg-red-50/30 dark:bg-red-950/10';
      case 'warning':
        return 'border-l-orange-500 bg-orange-50/30 dark:bg-orange-950/10';
      default:
        return 'border-l-slate-300 dark:border-l-slate-600';
    }
  };

  return (
    <Card className={cn(
      'hover:shadow-md transition-shadow border-l-4',
      getStatusColor()
    )}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {icon || getStatusIcon()}
                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {title}
                </CardTitle>
              </div>
              <div className="flex items-center gap-3">
                {value && (
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {value}
                  </span>
                )}
                <ChevronDown className={cn(
                  'h-4 w-4 text-slate-400 dark:text-slate-500 transition-transform',
                  isOpen && 'rotate-180'
                )} />
              </div>
            </div>
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

  return (
    <div className={cn('mt-8 space-y-6', className)}>
      {/* Section Title */}
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-slate-600 dark:text-slate-400" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Content Optimization & Quality
        </h2>
      </div>

      {/* Input Section - Only show if no external result */}
      {externalResult === undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content Audit</CardTitle>
            <CardDescription>
              Analyze content structure, text quality, and E-E-A-T signals for any URL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isPending}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isPending && url.trim()) {
                    handleAnalyze();
                  }
                }}
              />
              <Button
                onClick={handleAnalyze}
                disabled={isPending || !url.trim()}
                size="lg"
                className="w-full sm:w-auto min-w-[220px]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Analyze Content Optimization
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
            <CardDescription>
              Analyzing content structure, text quality, and E-E-A-T signals...
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Results */}
      {result && !isPending && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Text Wateriness */}
          <MinimalMetricCard
            title="Text Wateriness"
            icon={<FileText className="h-5 w-5" />}
            status={result.text_quality.wateriness_score < 25 ? 'good' : 'bad'}
            value={`${result.text_quality.wateriness_score.toFixed(1)}%`}
          >
            <div className="space-y-3">
              <div className="flex justify-center">
                <CircleGauge
                  score={result.text_quality.wateriness_score}
                  label="Wateriness Score"
                  size="sm"
                />
              </div>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <p>
                  <strong>Target:</strong> &lt; 25% is considered good. Lower wateriness indicates more meaningful content.
                </p>
                <p>
                  <strong>Current:</strong> {result.text_quality.wateriness_score.toFixed(1)}%
                  {result.text_quality.wateriness_score >= 25 && (
                    <span className="text-orange-600 dark:text-orange-400 ml-2">
                      ⚠️ Above recommended threshold
                    </span>
                  )}
                </p>
              </div>
            </div>
          </MinimalMetricCard>

          {/* Content Uniqueness */}
          <MinimalMetricCard
            title="Content Uniqueness"
            icon={<FileText className="h-5 w-5" />}
            status={result.text_quality.uniqueness_score >= 90 ? 'good' : result.text_quality.uniqueness_score >= 70 ? 'warning' : 'bad'}
            value={`${result.text_quality.uniqueness_score.toFixed(1)}%`}
          >
            <div className="space-y-3">
              <div className="flex justify-center">
                <CircleGauge
                  score={result.text_quality.uniqueness_score}
                  label="Uniqueness Score"
                  size="sm"
                />
              </div>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <p>
                  <strong>Target:</strong> &gt; 90% is considered excellent. Higher uniqueness reduces duplicate content penalties.
                </p>
                <p>
                  <strong>Current:</strong> {result.text_quality.uniqueness_score.toFixed(1)}%
                  {result.text_quality.uniqueness_score < 90 && (
                    <span className="text-orange-600 dark:text-orange-400 ml-2">
                      ⚠️ Below recommended threshold
                    </span>
                  )}
                </p>
                <p className="text-slate-500 dark:text-slate-400 italic mt-2">
                  Note: Currently using mock data. Integration with Copyleaks API pending.
                </p>
              </div>
            </div>
          </MinimalMetricCard>

          {/* Site Architecture */}
          <MinimalMetricCard
            title="Site Architecture"
            icon={<Settings className="h-5 w-5" />}
            status={result.structure.architecture_score >= 70 ? 'good' : result.structure.architecture_score >= 50 ? 'warning' : 'bad'}
            value={`${result.structure.architecture_score}/100`}
          >
            <div className="space-y-3">
              <div className="flex justify-center">
                <CircleGauge
                  score={result.structure.architecture_score}
                  label="Architecture Score"
                  size="sm"
                />
              </div>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <p>
                  <strong>Score:</strong> {result.structure.architecture_score}/100
                </p>
                <p>
                  <strong>Evaluation:</strong> Based on navigation depth, internal linking structure, and content organization.
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Higher scores indicate better site structure and user navigation.
                </p>
              </div>
            </div>
          </MinimalMetricCard>

          {/* Doctor Pages */}
          <MinimalMetricCard
            title="Doctor Pages"
            icon={<FileText className="h-5 w-5" />}
            status={result.structure.has_doctor_pages ? 'good' : 'bad'}
            value={result.structure.has_doctor_pages ? 'Found' : 'Missing'}
          >
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <p>
                <strong>Status:</strong> {result.structure.has_doctor_pages ? 'Doctor pages detected' : 'Doctor pages not found'}
              </p>
              <p>
                Doctor pages help establish expertise and authority for medical professionals on your website.
              </p>
            </div>
          </MinimalMetricCard>

          {/* Service Pages */}
          <MinimalMetricCard
            title="Service Pages"
            icon={<FileText className="h-5 w-5" />}
            status={result.structure.has_service_pages ? 'good' : 'bad'}
            value={result.structure.has_service_pages ? 'Found' : 'Missing'}
          >
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <p>
                <strong>Status:</strong> {result.structure.has_service_pages ? 'Service pages detected' : 'Service pages not found'}
              </p>
              <p>
                Service pages help users understand what medical services you offer.
              </p>
            </div>
          </MinimalMetricCard>

          {/* Department Pages */}
          <MinimalMetricCard
            title="Department Pages"
            icon={<FileText className="h-5 w-5" />}
            status={result.structure.has_department_pages ? 'good' : 'bad'}
            value={result.structure.has_department_pages ? 'Found' : 'Missing'}
          >
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <p>
                <strong>Status:</strong> {result.structure.has_department_pages ? 'Department pages detected' : 'Department pages not found'}
              </p>
              <p>
                Department pages organize medical services by specialty and improve site structure.
              </p>
            </div>
          </MinimalMetricCard>

          {/* Blog Presence */}
          <MinimalMetricCard
            title="Blog Presence"
            icon={<FileText className="h-5 w-5" />}
            status={result.structure.has_blog ? 'good' : 'bad'}
            value={result.structure.has_blog ? 'Found' : 'Missing'}
          >
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <p>
                <strong>Status:</strong> {result.structure.has_blog ? 'Blog section detected' : 'Blog section not found'}
              </p>
              <p>
                A blog helps demonstrate expertise, improve SEO, and engage with your audience.
              </p>
            </div>
          </MinimalMetricCard>

          {/* Authority Links */}
          <MinimalMetricCard
            title="Authority Links"
            icon={<Link2 className="h-5 w-5" />}
            status={result.authority.authority_links_count > 0 ? 'good' : 'bad'}
            value={result.authority.authority_links_count > 0 ? `${result.authority.authority_links_count}` : 'None'}
          >
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <p>
                <strong>Count:</strong> {result.authority.authority_links_count} trusted domain{result.authority.authority_links_count !== 1 ? 's' : ''}
              </p>
              <p>
                <strong>Trusted Sources:</strong> WHO, NIH, CDC, medical associations, educational institutions (.edu.ua, .gov.ua)
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Links to authoritative medical sources improve E-E-A-T signals.
              </p>
            </div>
          </MinimalMetricCard>

          {/* Valid Phone */}
          <MinimalMetricCard
            title="Valid Phone"
            icon={<Phone className="h-5 w-5" />}
            status={result.authority.has_valid_phone ? 'good' : 'bad'}
            value={result.authority.has_valid_phone ? 'Found' : 'Missing'}
          >
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <p>
                <strong>Status:</strong> {result.authority.has_valid_phone ? 'Phone number detected (tel: link or pattern match)' : 'Phone number not found'}
              </p>
              <p>
                Phone number is part of NAP (Name, Address, Phone) data important for local SEO.
              </p>
            </div>
          </MinimalMetricCard>

          {/* Valid Address */}
          <MinimalMetricCard
            title="Valid Address"
            icon={<MapPin className="h-5 w-5" />}
            status={result.authority.has_valid_address ? 'good' : 'bad'}
            value={result.authority.has_valid_address ? 'Found' : 'Missing'}
          >
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <p>
                <strong>Status:</strong> {result.authority.has_valid_address ? 'Address detected (city + street pattern)' : 'Address not found'}
              </p>
              <p>
                Physical address is part of NAP (Name, Address, Phone) data important for local SEO.
              </p>
            </div>
          </MinimalMetricCard>

          {/* FAQ Items */}
          <MinimalMetricCard
            title="FAQ Items"
            icon={<HelpCircle className="h-5 w-5" />}
            status={result.authority.faq_count >= 3 ? 'good' : result.authority.faq_count > 0 ? 'warning' : 'bad'}
            value={result.authority.faq_count > 0 ? `${result.authority.faq_count}` : 'None'}
          >
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <p>
                <strong>Count:</strong> {result.authority.faq_count} item{result.authority.faq_count !== 1 ? 's' : ''} found
                {result.authority.faq_count >= 3 ? ' (Good)' : result.authority.faq_count > 0 ? ' (Minimum 3 recommended)' : ' (Not found)'}
              </p>
              <p>
                FAQ sections help answer common questions and can display rich snippets in search results.
              </p>
            </div>
          </MinimalMetricCard>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <MinimalMetricCard
              title="Recommendations"
              icon={<AlertTriangle className="h-5 w-5" />}
              status="warning"
              value={`${result.recommendations.length} items`}
            >
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <ul className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </MinimalMetricCard>
          )}
        </div>
      )}
    </div>
  );
}
