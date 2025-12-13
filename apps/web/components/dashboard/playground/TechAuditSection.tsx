'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  FileText,
  Settings,
  AlertCircle,
  Info,
  ChevronDown,
  Zap,
  Shield,
  Search,
  Image,
  Gauge,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@kit/ui/collapsible';
import { cn } from '@kit/ui/utils';
import type { EphemeralAuditResult } from '~/lib/modules/audit/ephemeral-audit';

interface TechAuditSectionProps {
  data: EphemeralAuditResult;
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
function calculateOverallScore(data: EphemeralAuditResult): number {
  const scores: number[] = [];

  // Performance scores
  if (data.speed.desktop !== null) scores.push(data.speed.desktop);
  if (data.speed.mobile !== null) scores.push(data.speed.mobile);
  if (data.files.llmsTxt.present) scores.push(data.files.llmsTxt.score);

  // Security (boolean to score)
  if (data.security.https) scores.push(100);
  if (data.security.mobileFriendly) scores.push(100);

  // Files (boolean to score)
  if (data.files.robots) scores.push(100);
  if (data.files.sitemap) scores.push(100);

  // Meta tags (boolean to score)
  if (data.meta.title) scores.push(100);
  if (data.meta.description) scores.push(100);
  if (data.meta.h1) scores.push(100);

  // Images (percentage of images with alt)
  if (data.images.total > 0) {
    const altPercentage = ((data.images.total - data.images.missingAlt) / data.images.total) * 100;
    scores.push(altPercentage);
  }

  // External links (percentage of non-broken)
  if (data.externalLinks.total > 0) {
    const healthyPercentage = ((data.externalLinks.total - data.externalLinks.broken) / data.externalLinks.total) * 100;
    scores.push(healthyPercentage);
  }

  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

/**
 * Calculate Category Scores
 */
function calculateCategoryScores(data: EphemeralAuditResult) {
  const performanceScores: number[] = [];
  const securityScores: number[] = [];
  const seoScores: number[] = [];
  const contentScores: number[] = [];

  // Performance
  if (data.speed.desktop !== null) performanceScores.push(data.speed.desktop);
  if (data.speed.mobile !== null) performanceScores.push(data.speed.mobile);
  if (data.files.llmsTxt.present) performanceScores.push(data.files.llmsTxt.score);

  // Security
  if (data.security.https) securityScores.push(100);
  if (data.security.mobileFriendly) securityScores.push(100);

  // SEO
  if (data.files.robots) seoScores.push(100);
  if (data.files.sitemap) seoScores.push(100);
  if (data.meta.title) seoScores.push(100);
  if (data.meta.description) seoScores.push(100);
  if (data.meta.h1) seoScores.push(100);
  if (data.meta.canonical) seoScores.push(100);
  if (data.schema.hasMedicalOrg) seoScores.push(100);
  if (data.schema.hasPhysician) seoScores.push(100);
  if (data.schema.hasLocalBusiness) seoScores.push(100);

  // Content Quality
  if (data.images.total > 0) {
    const altPercentage = ((data.images.total - data.images.missingAlt) / data.images.total) * 100;
    contentScores.push(altPercentage);
  }
  if (data.externalLinks.total > 0) {
    const healthyPercentage = ((data.externalLinks.total - data.externalLinks.broken) / data.externalLinks.total) * 100;
    contentScores.push(healthyPercentage);
  }

  return {
    performance: performanceScores.length > 0 
      ? Math.round(performanceScores.reduce((a, b) => a + b, 0) / performanceScores.length)
      : null,
    security: securityScores.length > 0
      ? Math.round(securityScores.reduce((a, b) => a + b, 0) / securityScores.length)
      : null,
    seo: seoScores.length > 0
      ? Math.round(seoScores.reduce((a, b) => a + b, 0) / seoScores.length)
      : null,
    content: contentScores.length > 0
      ? Math.round(contentScores.reduce((a, b) => a + b, 0) / contentScores.length)
      : null,
  };
}

/**
 * TechAuditSection Component
 */
export function TechAuditSection({ data }: TechAuditSectionProps) {
  const overallScore = calculateOverallScore(data);
  const categoryScores = calculateCategoryScores(data);

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
    <div className="space-y-8">
      {/* Hero Section */}
      <Card className={cn('border-2', getScoreBgColor(overallScore))}>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Technical Audit Results
              </h1>
              <p className="text-sm text-muted-foreground">
                Overall assessment of your website's technical health
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
            {categoryScores.performance !== null && (
              <ProgressBar 
                value={categoryScores.performance} 
                label="Performance" 
                size="md"
              />
            )}
            {categoryScores.security !== null && (
              <ProgressBar 
                value={categoryScores.security} 
                label="Security" 
                size="md"
              />
            )}
            {categoryScores.seo !== null && (
              <ProgressBar 
                value={categoryScores.seo} 
                label="SEO & Files" 
                size="md"
              />
            )}
            {categoryScores.content !== null && (
              <ProgressBar 
                value={categoryScores.content} 
                label="Content Quality" 
                size="md"
              />
              )}
            </div>
        </CardHeader>
      </Card>

      {/* Performance Category */}
      <CategorySection 
        title="Performance" 
        icon={<Zap className="h-6 w-6 text-primary" />}
      >
        <MinimalMetricCard
          title="Desktop Speed"
          icon={<Gauge className="h-5 w-5" />}
          status={data.speed.desktop !== null && data.speed.desktop >= 90 ? 'good' : data.speed.desktop !== null && data.speed.desktop >= 50 ? 'warning' : 'bad'}
                score={data.speed.desktop}
        >
          <div className="space-y-4 text-sm text-muted-foreground">
            {data.speed.desktopDetails && (
              <>
                <div>
                  <h5 className="text-sm font-semibold mb-3 text-foreground">Core Web Vitals</h5>
                  <div className="space-y-2">
                    {data.speed.desktopDetails.lcp !== null && (
                      <div className="flex justify-between">
                        <span>LCP:</span>
                        <span className="font-medium">{Math.round(data.speed.desktopDetails.lcp)}ms</span>
                      </div>
                    )}
                    {data.speed.desktopDetails.fcp !== null && (
                      <div className="flex justify-between">
                        <span>FCP:</span>
                        <span className="font-medium">{Math.round(data.speed.desktopDetails.fcp)}ms</span>
                      </div>
                    )}
                    {data.speed.desktopDetails.cls !== null && (
                      <div className="flex justify-between">
                        <span>CLS:</span>
                        <span className="font-medium">{data.speed.desktopDetails.cls.toFixed(3)}</span>
                      </div>
                    )}
                    {data.speed.desktopDetails.tbt !== null && (
                      <div className="flex justify-between">
                        <span>TBT:</span>
                        <span className="font-medium">{Math.round(data.speed.desktopDetails.tbt)}ms</span>
                      </div>
                    )}
                    {data.speed.desktopDetails.si !== null && (
                      <div className="flex justify-between">
                        <span>Speed Index:</span>
                        <span className="font-medium">{Math.round(data.speed.desktopDetails.si)}ms</span>
                      </div>
                    )}
                    {data.speed.desktopDetails.ttfb !== null && (
                      <div className="flex justify-between">
                        <span>TTFB:</span>
                        <span className="font-medium">{Math.round(data.speed.desktopDetails.ttfb)}ms</span>
                      </div>
                    )}
                  </div>
                </div>
                {data.speed.desktopDetails.opportunities.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold mb-2 text-foreground">
                      Top Opportunities ({data.speed.desktopDetails.opportunities.length})
                    </h5>
                    <div className="space-y-2">
                      {data.speed.desktopDetails.opportunities.slice(0, 5).map((opp, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-orange-600 dark:text-orange-400 mt-0.5">•</span>
                          <span className="flex-1">{opp.title}</span>
                          {opp.savings && (
                            <span className="text-emerald-600 dark:text-emerald-400 text-xs">
                              {opp.savingsUnit === 'bytes' 
                                ? `-${(opp.savings / 1024).toFixed(1)}KB`
                                : `-${opp.savings}${opp.savingsUnit}`}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </MinimalMetricCard>

        <MinimalMetricCard
          title="Mobile Speed"
          icon={<Gauge className="h-5 w-5" />}
          status={data.speed.mobile !== null && data.speed.mobile >= 90 ? 'good' : data.speed.mobile !== null && data.speed.mobile >= 50 ? 'warning' : 'bad'}
                score={data.speed.mobile}
        >
          <div className="space-y-4 text-sm text-muted-foreground">
            {data.speed.mobileDetails && (
              <>
                <div>
                  <h5 className="text-sm font-semibold mb-3 text-foreground">Core Web Vitals</h5>
                  <div className="space-y-2">
                    {data.speed.mobileDetails.lcp !== null && (
                      <div className="flex justify-between">
                        <span>LCP:</span>
                        <span className="font-medium">{Math.round(data.speed.mobileDetails.lcp)}ms</span>
                      </div>
                    )}
                    {data.speed.mobileDetails.fcp !== null && (
                      <div className="flex justify-between">
                        <span>FCP:</span>
                        <span className="font-medium">{Math.round(data.speed.mobileDetails.fcp)}ms</span>
                      </div>
                    )}
                    {data.speed.mobileDetails.cls !== null && (
                      <div className="flex justify-between">
                        <span>CLS:</span>
                        <span className="font-medium">{data.speed.mobileDetails.cls.toFixed(3)}</span>
                      </div>
                    )}
                    {data.speed.mobileDetails.tbt !== null && (
                      <div className="flex justify-between">
                        <span>TBT:</span>
                        <span className="font-medium">{Math.round(data.speed.mobileDetails.tbt)}ms</span>
                      </div>
                    )}
                    {data.speed.mobileDetails.si !== null && (
                      <div className="flex justify-between">
                        <span>Speed Index:</span>
                        <span className="font-medium">{Math.round(data.speed.mobileDetails.si)}ms</span>
                      </div>
                    )}
                    {data.speed.mobileDetails.ttfb !== null && (
                      <div className="flex justify-between">
                        <span>TTFB:</span>
                        <span className="font-medium">{Math.round(data.speed.mobileDetails.ttfb)}ms</span>
                      </div>
                    )}
                  </div>
                </div>
                {data.speed.mobileDetails.opportunities.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold mb-2 text-foreground">
                      Top Opportunities ({data.speed.mobileDetails.opportunities.length})
                    </h5>
                    <div className="space-y-2">
                      {data.speed.mobileDetails.opportunities.slice(0, 5).map((opp, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-orange-600 dark:text-orange-400 mt-0.5">•</span>
                          <span className="flex-1">{opp.title}</span>
                          {opp.savings && (
                            <span className="text-emerald-600 dark:text-emerald-400 text-xs">
                              {opp.savingsUnit === 'bytes' 
                                ? `-${(opp.savings / 1024).toFixed(1)}KB`
                                : `-${opp.savings}${opp.savingsUnit}`}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </MinimalMetricCard>

        <MinimalMetricCard
          title="LLMS.txt Readiness"
          icon={<FileText className="h-5 w-5" />}
          status={data.files.llmsTxt.present && data.files.llmsTxt.score >= 70 ? 'good' : data.files.llmsTxt.present ? 'warning' : 'bad'}
          score={data.files.llmsTxt.present ? data.files.llmsTxt.score : null}
        >
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="space-y-2">
            <p>
                <strong className="text-foreground">File Present:</strong> {data.files.llmsTxt.present ? 'Yes' : 'No'}
            </p>
              {data.files.llmsTxt.present && data.files.llmsTxt.score !== null && (
            <p>
                  <strong className="text-foreground">AI Quality Score:</strong> {data.files.llmsTxt.score}/100
            </p>
              )}
          </div>
            {data.files.llmsTxt.recommendations && data.files.llmsTxt.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                  {data.files.llmsTxt.present ? 'Recommendations' : 'Suggestions'}
                </h4>
                <ul className="space-y-2">
                  {data.files.llmsTxt.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0">•</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </MinimalMetricCard>
      </CategorySection>

      {/* Security Category */}
      <CategorySection 
        title="Security" 
        icon={<Shield className="h-6 w-6 text-primary" />}
      >
        <MinimalMetricCard
          title="HTTPS"
          icon={<Shield className="h-5 w-5" />}
          status={data.security.https ? 'good' : 'bad'}
          value={data.security.https ? 'Enabled' : 'Disabled'}
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Status:</strong> {data.security.https ? 'HTTPS is enabled' : 'HTTPS is not enabled'}
            </p>
            <p>
              HTTPS encrypts data between the browser and server, improving security and SEO rankings.
            </p>
          </div>
        </MinimalMetricCard>

        <MinimalMetricCard
          title="Mobile Friendly"
          icon={<Settings className="h-5 w-5" />}
          status={data.security.mobileFriendly ? 'good' : 'bad'}
          value={data.security.mobileFriendly ? 'Yes' : 'No'}
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Status:</strong> {data.security.mobileFriendly ? 'Mobile-friendly' : 'Not mobile-friendly'}
            </p>
            <p>
              Mobile-friendly websites provide better user experience and rank higher in mobile search results.
            </p>
          </div>
        </MinimalMetricCard>
      </CategorySection>

      {/* SEO & Files Category */}
      <CategorySection 
        title="SEO & Files" 
        icon={<Search className="h-6 w-6 text-primary" />}
      >
        <MinimalMetricCard
          title="robots.txt"
          icon={<FileText className="h-5 w-5" />}
          status={data.files.robots ? 'good' : 'bad'}
          value={data.files.robots ? 'Present' : 'Missing'}
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Status:</strong> {data.files.robots ? 'File found' : 'File not found'}
            </p>
            <p>
              The robots.txt file tells search engines which pages they can and cannot access on your site.
            </p>
          </div>
        </MinimalMetricCard>

        <MinimalMetricCard
          title="sitemap.xml"
          icon={<FileText className="h-5 w-5" />}
          status={data.files.sitemap ? 'good' : 'bad'}
          value={data.files.sitemap ? 'Present' : 'Missing'}
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Status:</strong> {data.files.sitemap ? 'File found' : 'File not found'}
            </p>
            <p>
              A sitemap helps search engines discover and index all pages on your website.
            </p>
          </div>
        </MinimalMetricCard>

        <MinimalMetricCard
          title="Title Tag"
          icon={<Info className="h-5 w-5" />}
          status={data.meta.title ? 'good' : 'bad'}
          value={data.meta.title ? `${data.meta.title.length} chars` : 'Missing'}
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Status:</strong> {data.meta.title ? 'Present' : 'Missing'}
            </p>
            {data.meta.title && (
              <p className="bg-muted p-3 rounded border border-border text-sm">
                {data.meta.title}
              </p>
            )}
            <p>
              Title tag is crucial for SEO and appears in search results.
            </p>
          </div>
        </MinimalMetricCard>

        <MinimalMetricCard
          title="Meta Description"
          icon={<Info className="h-5 w-5" />}
          status={data.meta.description ? 'good' : 'bad'}
          value={data.meta.description ? `${data.meta.description.length} chars` : 'Missing'}
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Status:</strong> {data.meta.description ? 'Present' : 'Missing'}
            </p>
            {data.meta.description && (
              <p className="bg-muted p-3 rounded border border-border text-sm">
                {data.meta.description}
              </p>
            )}
            <p>
              Meta description appears in search results and influences click-through rates.
            </p>
          </div>
        </MinimalMetricCard>

        <MinimalMetricCard
          title="H1 Heading"
          icon={<Info className="h-5 w-5" />}
          status={data.meta.h1 ? 'good' : 'bad'}
          value={data.meta.h1 ? `${data.meta.h1.length} chars` : 'Missing'}
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Status:</strong> {data.meta.h1 ? 'Present' : 'Missing'}
            </p>
            {data.meta.h1 && (
              <p className="bg-muted p-3 rounded border border-border text-sm">
                {data.meta.h1}
              </p>
            )}
            <p>
              H1 tag is the main heading and important for SEO structure.
            </p>
          </div>
        </MinimalMetricCard>

        <MinimalMetricCard
          title="Schema Markup"
          icon={<FileText className="h-5 w-5" />}
          status={
            data.schema.hasMedicalOrg || 
            data.schema.hasPhysician || 
            data.schema.hasLocalBusiness 
              ? 'good' 
              : 'warning'
          }
          value={
            [
              data.schema.hasMedicalOrg && 'Medical Org',
              data.schema.hasPhysician && 'Physician',
              data.schema.hasLocalBusiness && 'Local Business',
              data.schema.hasMedicalProcedure && 'Procedure',
              data.schema.hasBreadcrumbList && 'Breadcrumb',
            ].filter(Boolean).join(', ') || 'None'
          }
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <strong className="text-foreground">Medical Org:</strong> {data.schema.hasMedicalOrg ? '✓' : '✗'}
          </div>
              <div>
                <strong className="text-foreground">Physician:</strong> {data.schema.hasPhysician ? '✓' : '✗'}
          </div>
              <div>
                <strong className="text-foreground">Local Business:</strong> {data.schema.hasLocalBusiness ? '✓' : '✗'}
          </div>
              <div>
                <strong className="text-foreground">Procedure:</strong> {data.schema.hasMedicalProcedure ? '✓' : '✗'}
              </div>
            </div>
            <p>
              Schema markup helps search engines understand your content and can display rich snippets.
            </p>
          </div>
        </MinimalMetricCard>
      </CategorySection>

      {/* Content Quality Category */}
      <CategorySection 
        title="Content Quality" 
        icon={<Image className="h-6 w-6 text-primary" />}
      >
        <MinimalMetricCard
          title="Images Analysis"
          icon={<Image className="h-5 w-5" />}
          status={data.images.missingAlt === 0 ? 'good' : data.images.missingAlt <= data.images.total * 0.1 ? 'warning' : 'bad'}
          value={`${data.images.total} total`}
          score={data.images.total > 0 ? Math.round(((data.images.total - data.images.missingAlt) / data.images.total) * 100) : null}
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Total Images:</span>
              <span className="font-medium text-foreground">{data.images.total}</span>
            </div>
            <div className="flex justify-between">
              <span>Missing Alt Tags:</span>
              <span className={cn(
                "font-medium",
                data.images.missingAlt === 0 
                  ? "text-emerald-600 dark:text-emerald-400" 
                  : data.images.missingAlt <= data.images.total * 0.1
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-red-600 dark:text-red-400"
              )}>
                {data.images.missingAlt}
                {data.images.total > 0 && (
                  <span className="text-muted-foreground ml-1">
                    ({Math.round((data.images.missingAlt / data.images.total) * 100)}%)
                  </span>
                )}
              </span>
            </div>
            {data.images.missingAlt > 0 && (
              <p className="text-orange-600 dark:text-orange-400 mt-2 text-sm">
                ⚠️ {data.images.missingAlt} image{data.images.missingAlt > 1 ? 's' : ''} missing alt text for accessibility
              </p>
            )}
          </div>
        </MinimalMetricCard>

        <MinimalMetricCard
          title="External Links"
          icon={<FileText className="h-5 w-5" />}
          status={data.externalLinks.broken === 0 && data.externalLinks.trusted > 0 ? 'good' : data.externalLinks.broken > 0 ? 'bad' : 'neutral'}
          value={`${data.externalLinks.total} total`}
          score={data.externalLinks.total > 0 ? Math.round(((data.externalLinks.total - data.externalLinks.broken) / data.externalLinks.total) * 100) : null}
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Total External Links:</span>
              <span className="font-medium text-foreground">{data.externalLinks.total}</span>
            </div>
            <div className="flex justify-between">
              <span>Broken Links (404):</span>
              <span className={cn(
                "font-medium",
                data.externalLinks.broken === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
              )}>
                {data.externalLinks.broken}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Trusted Domains:</span>
              <span className={cn(
                "font-medium",
                data.externalLinks.trusted > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              )}>
                {data.externalLinks.trusted > 0 ? data.externalLinks.trusted : 'None'}
              </span>
            </div>
            {data.externalLinks.broken > 0 && (
              <p className="text-orange-600 dark:text-orange-400 mt-2 text-sm">
                ⚠️ {data.externalLinks.broken} broken link{data.externalLinks.broken > 1 ? 's' : ''} found
              </p>
            )}
          </div>
        </MinimalMetricCard>

        <MinimalMetricCard
          title="URL Duplicates"
          icon={<Settings className="h-5 w-5" />}
          status={
            data.duplicates.wwwRedirect === 'ok' && 
            data.duplicates.trailingSlash === 'ok' && 
            data.duplicates.httpRedirect === 'ok'
              ? 'good' 
              : data.duplicates.wwwRedirect === 'duplicate' || 
                data.duplicates.trailingSlash === 'duplicate' || 
                data.duplicates.httpRedirect === 'duplicate'
              ? 'warning'
              : 'neutral'
          }
          value={
            [
              data.duplicates.wwwRedirect === 'ok' && 'WWW ✓',
              data.duplicates.trailingSlash === 'ok' && 'Slash ✓',
              data.duplicates.httpRedirect === 'ok' && 'HTTPS ✓',
            ].filter(Boolean).join(', ') || 'Check needed'
          }
        >
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="space-y-1">
              <div>
                <strong className="text-foreground">WWW Redirect:</strong>{' '}
                {data.duplicates.wwwRedirect === 'ok' ? '✓ OK' : data.duplicates.wwwRedirect === 'duplicate' ? '⚠ Duplicate' : '? Unknown'}
          </div>
              <div>
                <strong className="text-foreground">Trailing Slash:</strong>{' '}
                {data.duplicates.trailingSlash === 'ok' ? '✓ OK' : data.duplicates.trailingSlash === 'duplicate' ? '⚠ Duplicate' : '? Unknown'}
          </div>
              <div>
                <strong className="text-foreground">HTTP → HTTPS:</strong>{' '}
                {data.duplicates.httpRedirect === 'ok' ? '✓ OK' : data.duplicates.httpRedirect === 'duplicate' ? '⚠ Duplicate' : '? Unknown'}
          </div>
          </div>
            <p>
              Consistent URL handling prevents duplicate content issues and improves SEO.
            </p>
          </div>
        </MinimalMetricCard>
      </CategorySection>
    </div>
  );
}
