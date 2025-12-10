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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@kit/ui/collapsible';
import { cn } from '@kit/ui/utils';
import type { EphemeralAuditResult } from '~/lib/modules/audit/ephemeral-audit';

interface TechAuditSectionProps {
  data: EphemeralAuditResult;
}

/**
 * Circle Gauge Component
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
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{label}</span>
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
 * Minimal Metric Card Component
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

/**
 * LLMS.txt Recommendations Dialog
 */
function LlmsTxtRecommendationsDialog({
  open,
  onOpenChange,
  recommendations,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recommendations: string[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>LLMS.txt Recommendations</DialogTitle>
          <DialogDescription>
            AI-powered recommendations to improve your llms.txt file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {recommendations.length > 0 ? (
            <ul className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0">•</span>
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {recommendation}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No recommendations available
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * TechAuditSection Component
 * Displays technical audit results for playground
 */
export function TechAuditSection({ data }: TechAuditSectionProps) {
  const [llmsDialogOpen, setLlmsDialogOpen] = useState(false);

  return (
    <div className="mt-8 space-y-6">
      {/* Section Title */}
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-slate-600 dark:text-slate-400" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Technical Optimization & Readiness
        </h2>
      </div>

      {/* Row 1: Performance & Quality - Minimal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* LLMS.txt Readiness */}
        <MinimalMetricCard
          title="LLMS.txt Readiness"
          icon={<FileText className="h-5 w-5" />}
          status={data.files.llmsTxt.present && data.files.llmsTxt.score >= 70 ? 'good' : data.files.llmsTxt.present ? 'warning' : 'bad'}
          value={data.files.llmsTxt.present ? `${data.files.llmsTxt.score}/100` : 'Not Found'}
        >
          <div className="space-y-3">
            <div className="flex justify-center">
              <CircleGauge
                score={data.files.llmsTxt.present ? data.files.llmsTxt.score : null}
                label="AI Quality Score"
                size="sm"
              />
            </div>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <p>
                <strong>File Present:</strong> {data.files.llmsTxt.present ? 'Yes' : 'No'}
              </p>
              {(data.files.llmsTxt.present || data.files.llmsTxt.recommendations.length > 0) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs w-full"
                  onClick={() => setLlmsDialogOpen(true)}
                >
                  {data.files.llmsTxt.present ? 'View Recommendations' : 'View Suggestions'}
                </Button>
              )}
            </div>
          </div>
        </MinimalMetricCard>

        {/* Desktop Speed */}
        <MinimalMetricCard
          title="Desktop Speed"
          icon={<Settings className="h-5 w-5" />}
          status={data.speed.desktop >= 90 ? 'good' : data.speed.desktop >= 50 ? 'warning' : 'bad'}
          value={`${data.speed.desktop}/100`}
        >
          <div className="space-y-3">
            <div className="flex justify-center">
              <CircleGauge
                score={data.speed.desktop}
                label="PageSpeed Score"
                size="sm"
              />
            </div>
            {data.speed.desktopDetails && (
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                {/* Core Web Vitals */}
                <div>
                  <h5 className="text-xs font-semibold mb-2">Core Web Vitals</h5>
                  <div className="space-y-1">
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
                {/* Categories */}
                {Object.values(data.speed.desktopDetails.categories).some(v => v !== null) && (
                  <div>
                    <h5 className="text-xs font-semibold mb-2">Categories</h5>
                    <div className="space-y-1">
                      {data.speed.desktopDetails.categories.performance !== null && (
                        <div className="flex justify-between">
                          <span>Performance:</span>
                          <span className="font-medium">{data.speed.desktopDetails.categories.performance}/100</span>
                        </div>
                      )}
                      {data.speed.desktopDetails.categories.accessibility !== null && (
                        <div className="flex justify-between">
                          <span>Accessibility:</span>
                          <span className="font-medium">{data.speed.desktopDetails.categories.accessibility}/100</span>
                        </div>
                      )}
                      {data.speed.desktopDetails.categories.bestPractices !== null && (
                        <div className="flex justify-between">
                          <span>Best Practices:</span>
                          <span className="font-medium">{data.speed.desktopDetails.categories.bestPractices}/100</span>
                        </div>
                      )}
                      {data.speed.desktopDetails.categories.seo !== null && (
                        <div className="flex justify-between">
                          <span>SEO:</span>
                          <span className="font-medium">{data.speed.desktopDetails.categories.seo}/100</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Opportunities */}
                {data.speed.desktopDetails.opportunities.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold mb-2">Top Opportunities ({data.speed.desktopDetails.opportunities.length})</h5>
                    <div className="space-y-1">
                      {data.speed.desktopDetails.opportunities.slice(0, 5).map((opp, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-orange-600 dark:text-orange-400 mt-0.5">•</span>
                          <span className="flex-1">{opp.title}</span>
                          {opp.savings && (
                            <span className="text-emerald-600 dark:text-emerald-400">
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
              </div>
            )}
          </div>
        </MinimalMetricCard>

        {/* Mobile Speed */}
        <MinimalMetricCard
          title="Mobile Speed"
          icon={<Settings className="h-5 w-5" />}
          status={data.speed.mobile >= 90 ? 'good' : data.speed.mobile >= 50 ? 'warning' : 'bad'}
          value={`${data.speed.mobile}/100`}
        >
          <div className="space-y-3">
            <div className="flex justify-center">
              <CircleGauge
                score={data.speed.mobile}
                label="PageSpeed Score"
                size="sm"
              />
            </div>
            {data.speed.mobileDetails && (
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                {/* Core Web Vitals */}
                <div>
                  <h5 className="text-xs font-semibold mb-2">Core Web Vitals</h5>
                  <div className="space-y-1">
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
                {/* Categories */}
                {Object.values(data.speed.mobileDetails.categories).some(v => v !== null) && (
                  <div>
                    <h5 className="text-xs font-semibold mb-2">Categories</h5>
                    <div className="space-y-1">
                      {data.speed.mobileDetails.categories.performance !== null && (
                        <div className="flex justify-between">
                          <span>Performance:</span>
                          <span className="font-medium">{data.speed.mobileDetails.categories.performance}/100</span>
                        </div>
                      )}
                      {data.speed.mobileDetails.categories.accessibility !== null && (
                        <div className="flex justify-between">
                          <span>Accessibility:</span>
                          <span className="font-medium">{data.speed.mobileDetails.categories.accessibility}/100</span>
                        </div>
                      )}
                      {data.speed.mobileDetails.categories.bestPractices !== null && (
                        <div className="flex justify-between">
                          <span>Best Practices:</span>
                          <span className="font-medium">{data.speed.mobileDetails.categories.bestPractices}/100</span>
                        </div>
                      )}
                      {data.speed.mobileDetails.categories.seo !== null && (
                        <div className="flex justify-between">
                          <span>SEO:</span>
                          <span className="font-medium">{data.speed.mobileDetails.categories.seo}/100</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Opportunities */}
                {data.speed.mobileDetails.opportunities.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold mb-2">Top Opportunities ({data.speed.mobileDetails.opportunities.length})</h5>
                    <div className="space-y-1">
                      {data.speed.mobileDetails.opportunities.slice(0, 5).map((opp, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-orange-600 dark:text-orange-400 mt-0.5">•</span>
                          <span className="flex-1">{opp.title}</span>
                          {opp.savings && (
                            <span className="text-emerald-600 dark:text-emerald-400">
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
              </div>
            )}
          </div>
        </MinimalMetricCard>
      </div>

      {/* Row 2: Technical Signals (Grid) - Minimal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* robots.txt */}
        <MinimalMetricCard
          title="robots.txt"
          icon={<FileText className="h-5 w-5" />}
          status={data.files.robots ? 'good' : 'bad'}
          value={data.files.robots ? 'Present' : 'Missing'}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              <strong>Status:</strong> {data.files.robots ? 'File found' : 'File not found'}
            </p>
            <p>
              The robots.txt file tells search engines which pages they can and cannot access on your site.
            </p>
          </div>
        </MinimalMetricCard>

        {/* sitemap.xml */}
        <MinimalMetricCard
          title="sitemap.xml"
          icon={<FileText className="h-5 w-5" />}
          status={data.files.sitemap ? 'good' : 'bad'}
          value={data.files.sitemap ? 'Present' : 'Missing'}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              <strong>Status:</strong> {data.files.sitemap ? 'File found' : 'File not found'}
            </p>
            <p>
              A sitemap helps search engines discover and index all pages on your website.
            </p>
          </div>
        </MinimalMetricCard>

        {/* HTTPS */}
        <MinimalMetricCard
          title="HTTPS"
          icon={<Settings className="h-5 w-5" />}
          status={data.security.https ? 'good' : 'bad'}
          value={data.security.https ? 'Enabled' : 'Disabled'}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              <strong>Status:</strong> {data.security.https ? 'HTTPS is enabled' : 'HTTPS is not enabled'}
            </p>
            <p>
              HTTPS encrypts data between the browser and server, improving security and SEO rankings.
            </p>
          </div>
        </MinimalMetricCard>

        {/* Mobile Friendly */}
        <MinimalMetricCard
          title="Mobile Friendly"
          icon={<Settings className="h-5 w-5" />}
          status={data.security.mobileFriendly ? 'good' : 'bad'}
          value={data.security.mobileFriendly ? 'Yes' : 'No'}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              <strong>Status:</strong> {data.security.mobileFriendly ? 'Mobile-friendly' : 'Not mobile-friendly'}
            </p>
            <p>
              Mobile-friendly websites provide better user experience and rank higher in mobile search results.
            </p>
          </div>
        </MinimalMetricCard>

        {/* Schema Markup - Individual Cards */}
        <MinimalMetricCard
          title="Medical Organization Schema"
          icon={<FileText className="h-5 w-5" />}
          status={data.schema.hasMedicalOrg ? 'good' : 'bad'}
          value={data.schema.hasMedicalOrg ? 'Found' : 'Missing'}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              <strong>Status:</strong> {data.schema.hasMedicalOrg ? 'Schema found' : 'Schema not found'}
            </p>
            <p>
              Medical Organization schema helps search engines understand your medical practice structure.
            </p>
          </div>
        </MinimalMetricCard>

        <MinimalMetricCard
          title="Physician Schema"
          icon={<FileText className="h-5 w-5" />}
          status={data.schema.hasPhysician ? 'good' : 'bad'}
          value={data.schema.hasPhysician ? 'Found' : 'Missing'}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              <strong>Status:</strong> {data.schema.hasPhysician ? 'Schema found' : 'Schema not found'}
            </p>
            <p>
              Physician schema provides structured data about doctors on your website.
            </p>
          </div>
        </MinimalMetricCard>

        <MinimalMetricCard
          title="Medical Procedure Schema"
          icon={<FileText className="h-5 w-5" />}
          status={data.schema.hasMedicalProcedure ? 'good' : 'bad'}
          value={data.schema.hasMedicalProcedure ? 'Found' : 'Missing'}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              <strong>Status:</strong> {data.schema.hasMedicalProcedure ? 'Schema found' : 'Schema not found'}
            </p>
            <p>
              Medical Procedure schema helps describe treatments and services offered.
            </p>
          </div>
        </MinimalMetricCard>

        <MinimalMetricCard
          title="Local Business Schema"
          icon={<FileText className="h-5 w-5" />}
          status={data.schema.hasLocalBusiness ? 'good' : 'bad'}
          value={data.schema.hasLocalBusiness ? 'Found' : 'Missing'}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              <strong>Status:</strong> {data.schema.hasLocalBusiness ? 'Schema found' : 'Schema not found'}
            </p>
            <p>
              Local Business schema improves local SEO and helps with Google Business Profile integration.
            </p>
          </div>
        </MinimalMetricCard>

        <MinimalMetricCard
          title="Reviews / FAQ Schema"
          icon={<FileText className="h-5 w-5" />}
          status={data.schema.hasReviews || data.schema.hasFAQ ? 'good' : 'bad'}
          value={data.schema.hasReviews || data.schema.hasFAQ ? 'Found' : 'Missing'}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              <strong>Status:</strong> {(data.schema.hasReviews || data.schema.hasFAQ) ? 'Schema found' : 'Schema not found'}
            </p>
            <p>
              Reviews and FAQ schema can display rich snippets in search results.
            </p>
          </div>
        </MinimalMetricCard>

        <MinimalMetricCard
          title="Medical Specialty Schema"
          icon={<FileText className="h-5 w-5" />}
          status={data.schema.hasMedicalSpecialty ? 'good' : 'bad'}
          value={data.schema.hasMedicalSpecialty ? 'Found' : 'Missing'}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              <strong>Status:</strong> {data.schema.hasMedicalSpecialty ? 'Schema found' : 'Schema not found'}
            </p>
            <p>
              Medical Specialty schema helps categorize your medical practice areas.
            </p>
          </div>
        </MinimalMetricCard>

        <MinimalMetricCard
          title="Breadcrumb List Schema"
          icon={<FileText className="h-5 w-5" />}
          status={data.schema.hasBreadcrumbList ? 'good' : 'bad'}
          value={data.schema.hasBreadcrumbList ? 'Found' : 'Missing'}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              <strong>Status:</strong> {data.schema.hasBreadcrumbList ? 'Schema found' : 'Schema not found'}
            </p>
            <p>
              Breadcrumb schema shows navigation path in search results.
            </p>
          </div>
        </MinimalMetricCard>

        {/* Duplicate Prevention - Individual Cards */}
        <MinimalMetricCard
          title="WWW Redirect"
          icon={<Settings className="h-5 w-5" />}
          status={data.duplicates.wwwRedirect === 'ok' ? 'good' : data.duplicates.wwwRedirect === 'duplicate' ? 'warning' : 'neutral'}
          value={data.duplicates.wwwRedirect === 'ok' ? 'OK' : data.duplicates.wwwRedirect === 'duplicate' ? 'Duplicate' : 'Unknown'}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              <strong>Status:</strong> {data.duplicates.wwwRedirect === 'ok' ? 'Proper redirect configured' : data.duplicates.wwwRedirect === 'duplicate' ? 'Both www and non-www accessible' : 'Status unknown'}
            </p>
            <p>
              Ensure either www or non-www version redirects to the other to avoid duplicate content.
            </p>
          </div>
        </MinimalMetricCard>

        <MinimalMetricCard
          title="Trailing Slash"
          icon={<Settings className="h-5 w-5" />}
          status={data.duplicates.trailingSlash === 'ok' ? 'good' : data.duplicates.trailingSlash === 'duplicate' ? 'warning' : 'neutral'}
          value={data.duplicates.trailingSlash === 'ok' ? 'OK' : data.duplicates.trailingSlash === 'duplicate' ? 'Duplicate' : 'Unknown'}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              <strong>Status:</strong> {data.duplicates.trailingSlash === 'ok' ? 'Consistent trailing slash handling' : data.duplicates.trailingSlash === 'duplicate' ? 'Both versions accessible' : 'Status unknown'}
            </p>
            <p>
              Consistent trailing slash handling prevents duplicate URLs.
            </p>
          </div>
        </MinimalMetricCard>

        <MinimalMetricCard
          title="HTTP → HTTPS Redirect"
          icon={<Settings className="h-5 w-5" />}
          status={data.duplicates.httpRedirect === 'ok' ? 'good' : data.duplicates.httpRedirect === 'duplicate' ? 'warning' : 'neutral'}
          value={data.duplicates.httpRedirect === 'ok' ? 'OK' : data.duplicates.httpRedirect === 'duplicate' ? 'Duplicate' : 'Unknown'}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              <strong>Status:</strong> {data.duplicates.httpRedirect === 'ok' ? 'HTTP redirects to HTTPS' : data.duplicates.httpRedirect === 'duplicate' ? 'Both HTTP and HTTPS accessible' : 'Status unknown'}
            </p>
            <p>
              HTTP should redirect to HTTPS to avoid duplicate content and improve security.
            </p>
            <p className="text-slate-500 dark:text-slate-400 italic mt-2">
              Full content duplicate analysis requires a full site crawl (available in Full Audit mode).
            </p>
          </div>
        </MinimalMetricCard>
      </div>

      {/* Row 3: Content Quality & Links - Minimal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Images Analysis */}
        <MinimalMetricCard
          title="Images Analysis"
          icon={<FileText className="h-5 w-5" />}
          status={data.images.missingAlt === 0 ? 'good' : data.images.missingAlt <= data.images.total * 0.1 ? 'warning' : 'bad'}
          value={`${data.images.total} total`}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Total Images:</span>
              <span className="font-medium">{data.images.total}</span>
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
                  <span className="text-slate-500 dark:text-slate-400 ml-1">
                    ({Math.round((data.images.missingAlt / data.images.total) * 100)}%)
                  </span>
                )}
              </span>
            </div>
            {data.images.missingAlt > 0 && (
              <p className="text-orange-600 dark:text-orange-400 mt-2">
                ⚠️ {data.images.missingAlt} image{data.images.missingAlt > 1 ? 's' : ''} missing alt text for accessibility
              </p>
            )}
          </div>
        </MinimalMetricCard>

        {/* External Links */}
        <MinimalMetricCard
          title="External Links"
          icon={<FileText className="h-5 w-5" />}
          status={data.externalLinks.broken === 0 && data.externalLinks.trusted > 0 ? 'good' : data.externalLinks.broken > 0 ? 'bad' : 'neutral'}
          value={`${data.externalLinks.total} total`}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Total External Links:</span>
              <span className="font-medium">{data.externalLinks.total}</span>
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
                data.externalLinks.trusted > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
              )}>
                {data.externalLinks.trusted > 0 ? data.externalLinks.trusted : 'None'}
              </span>
            </div>
            {data.externalLinks.broken > 0 && (
              <p className="text-orange-600 dark:text-orange-400 mt-2">
                ⚠️ {data.externalLinks.broken} broken link{data.externalLinks.broken > 1 ? 's' : ''} found
              </p>
            )}
          </div>
        </MinimalMetricCard>
      </div>

      {/* Row 4: Meta Tags - Minimal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Title */}
        <MinimalMetricCard
          title="Title Tag"
          icon={<Info className="h-5 w-5" />}
          status={data.meta.title ? 'good' : 'bad'}
          value={data.meta.title ? `${data.meta.title.length} chars` : 'Missing'}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              <strong>Status:</strong> {data.meta.title ? 'Present' : 'Missing'}
            </p>
            {data.meta.title && (
              <p className="bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                {data.meta.title}
              </p>
            )}
            <p>
              Title tag is crucial for SEO and appears in search results.
            </p>
          </div>
        </MinimalMetricCard>

        {/* Description */}
        <MinimalMetricCard
          title="Meta Description"
          icon={<Info className="h-5 w-5" />}
          status={data.meta.description ? 'good' : 'bad'}
          value={data.meta.description ? `${data.meta.description.length} chars` : 'Missing'}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              <strong>Status:</strong> {data.meta.description ? 'Present' : 'Missing'}
            </p>
            {data.meta.description && (
              <p className="bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                {data.meta.description}
              </p>
            )}
            <p>
              Meta description appears in search results and influences click-through rates.
            </p>
          </div>
        </MinimalMetricCard>

        {/* H1 */}
        <MinimalMetricCard
          title="H1 Heading"
          icon={<Info className="h-5 w-5" />}
          status={data.meta.h1 ? 'good' : 'bad'}
          value={data.meta.h1 ? `${data.meta.h1.length} chars` : 'Missing'}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              <strong>Status:</strong> {data.meta.h1 ? 'Present' : 'Missing'}
            </p>
            {data.meta.h1 && (
              <p className="bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                {data.meta.h1}
              </p>
            )}
            <p>
              H1 tag is the main heading and important for SEO structure.
            </p>
          </div>
        </MinimalMetricCard>

        {/* Canonical */}
        <MinimalMetricCard
          title="Canonical URL"
          icon={<Info className="h-5 w-5" />}
          status={data.meta.canonical ? 'good' : 'warning'}
          value={data.meta.canonical ? 'Set' : 'Missing'}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              <strong>Status:</strong> {data.meta.canonical ? 'Present' : 'Missing (recommended)'}
            </p>
            {data.meta.canonical && (
              <p className="bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 break-all font-mono text-xs">
                {data.meta.canonical}
              </p>
            )}
            <p>
              Canonical tag prevents duplicate content issues by specifying the preferred URL.
            </p>
          </div>
        </MinimalMetricCard>

        {/* Robots */}
        <MinimalMetricCard
          title="Robots Meta Tag"
          icon={<Info className="h-5 w-5" />}
          status={data.meta.robots ? 'good' : 'neutral'}
          value={data.meta.robots ? 'Set' : 'Not set'}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              <strong>Status:</strong> {data.meta.robots ? 'Present' : 'Not set (default: index, follow)'}
            </p>
            {data.meta.robots && (
              <p className="bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 font-mono text-xs">
                {data.meta.robots}
              </p>
            )}
            <p>
              Robots meta tag controls how search engines index and follow links on the page.
            </p>
          </div>
        </MinimalMetricCard>

        {/* Lang */}
        <MinimalMetricCard
          title="HTML Lang Attribute"
          icon={<Info className="h-5 w-5" />}
          status={data.meta.lang ? 'good' : 'warning'}
          value={data.meta.lang ? data.meta.lang : 'Missing'}
        >
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <p>
              <strong>Status:</strong> {data.meta.lang ? 'Present' : 'Missing (recommended)'}
            </p>
            {data.meta.lang && (
              <p className="bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 font-mono text-xs">
                {data.meta.lang}
              </p>
            )}
            <p>
              Lang attribute helps screen readers and search engines understand the page language.
            </p>
          </div>
        </MinimalMetricCard>
      </div>

      {/* Row 5: AI Analysis Summary */}
      {data.aiAnalysis && (
        <div className="grid grid-cols-1 gap-6">
          <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Info className="h-6 w-6" />
                AI-Powered Technical Audit Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Score */}
              <div className="flex items-center justify-center">
                <CircleGauge
                  score={data.aiAnalysis.overallScore}
                  label="Overall Technical Health"
                  size="lg"
                />
              </div>

              {/* Summary */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Summary
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {data.aiAnalysis.summary}
                </p>
              </div>

              {/* Critical Issues */}
              {data.aiAnalysis.criticalIssues.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Critical Issues ({data.aiAnalysis.criticalIssues.length})
                  </h4>
                  <ul className="space-y-2">
                    {data.aiAnalysis.criticalIssues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0">⚠️</span>
                        <span className="text-slate-700 dark:text-slate-300">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Priority Recommendations */}
              {data.aiAnalysis.priorityRecommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-2 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Priority Recommendations ({data.aiAnalysis.priorityRecommendations.length})
                  </h4>
                  <ul className="space-y-2">
                    {data.aiAnalysis.priorityRecommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0">•</span>
                        <span className="text-slate-700 dark:text-slate-300">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Strengths */}
              {data.aiAnalysis.strengths.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Strengths ({data.aiAnalysis.strengths.length})
                  </h4>
                  <ul className="space-y-2">
                    {data.aiAnalysis.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                        <span className="text-slate-700 dark:text-slate-300">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quick Wins */}
              {data.aiAnalysis.quickWins.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Quick Wins ({data.aiAnalysis.quickWins.length})
                  </h4>
                  <ul className="space-y-2">
                    {data.aiAnalysis.quickWins.map((win, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0">⚡</span>
                        <span className="text-slate-700 dark:text-slate-300">{win}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* LLMS.txt Recommendations Dialog */}
      <LlmsTxtRecommendationsDialog
        open={llmsDialogOpen}
        onOpenChange={setLlmsDialogOpen}
        recommendations={data.files.llmsTxt.recommendations}
      />
    </div>
  );
}

