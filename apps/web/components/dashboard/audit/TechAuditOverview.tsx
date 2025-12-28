'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  FileText,
  Shield,
  Smartphone,
  Globe,
  AlertCircle,
  Play,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { cn } from '@kit/ui/utils';
import type { TechAudit } from '~/lib/modules/audit/tech-audit-service';

interface TechAuditOverviewProps {
  auditData: TechAudit | null;
  onRunAudit?: () => void;
}

/**
 * Circle Gauge Component
 * Displays a score (0-100) in a circular progress indicator
 */
interface CircleGaugeProps {
  score: number | null;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

function CircleGauge({ score, label, size = 'md', onClick }: CircleGaugeProps) {
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
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  if (score === null) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className={cn('flex items-center justify-center rounded-full border-2 border-border', sizeClasses[size])}>
          <span className="text-muted-foreground text-sm">N/A</span>
        </div>
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          'relative',
          onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        )}
        style={{ width: sizeClasses[size], height: sizeClasses[size] }}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={onClick ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        } : undefined}
      >
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
            className="text-muted"
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
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

/**
 * Empty State Component
 */
function EmptyState({ onRunAudit }: { onRunAudit?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No Technical Audit Yet
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        Run a technical audit to analyze your site's performance, security, and optimization.
      </p>
      {onRunAudit && (
        <Button onClick={onRunAudit} size="lg">
          <Play className="h-4 w-4 mr-2" />
          Run Audit
        </Button>
      )}
    </div>
  );
}

/**
 * Status Badge Component
 */
function StatusBadge({ status }: { status: TechAudit['status'] }) {
  const variants = {
    completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    running: 'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    failed: 'bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  };

  return (
    <Badge variant="outline" className={cn('capitalize', variants[status])}>
      {status}
    </Badge>
  );
}

/**
 * LLMS.txt Details Dialog Component
 */
interface LlmsTxtDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  llmsTxtData: Record<string, unknown>;
}

function LlmsTxtDetailsDialog({
  open,
  onOpenChange,
  llmsTxtData,
}: LlmsTxtDetailsDialogProps) {
  const summary = typeof llmsTxtData.summary === 'string' ? llmsTxtData.summary : null;
  const missingSections = Array.isArray(llmsTxtData.missing_sections)
    ? llmsTxtData.missing_sections.filter((item): item is string => typeof item === 'string')
    : [];
  const recommendations = Array.isArray(llmsTxtData.recommendations)
    ? llmsTxtData.recommendations.filter((item): item is string => typeof item === 'string')
    : [];
  const contentPreview = typeof llmsTxtData.contentPreview === 'string'
    ? llmsTxtData.contentPreview
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>LLMS.txt Analysis Details</DialogTitle>
          <DialogDescription>
            AI-powered analysis of your llms.txt file structure and content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          {summary && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Summary
              </h3>
              <p className="text-sm text-muted-foreground">{summary}</p>
            </div>
          )}

          {/* Missing Sections */}
          {missingSections.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Missing Sections
              </h3>
              <div className="space-y-2">
                {missingSections.map((section, index) => (
                  <Alert key={index} variant="warning">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="text-xs">Warning</AlertTitle>
                    <AlertDescription className="text-sm">{section}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Recommendations
              </h3>
              <ul className="space-y-2">
                {recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">•</span>
                    <span className="text-sm text-muted-foreground">
                      {recommendation}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw Content Preview */}
          {contentPreview && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Content Preview
              </h3>
              <div className="rounded-md bg-muted p-4 overflow-x-auto">
                <pre className="text-xs text-foreground whitespace-pre-wrap break-words">
                  {contentPreview}
                </pre>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Showing first 200 characters of llms.txt file
              </p>
            </div>
          )}

          {/* Empty State */}
          {!summary && missingSections.length === 0 && recommendations.length === 0 && !contentPreview && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No analysis data available
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Main TechAuditOverview Component
 */
export function TechAuditOverview({ auditData, onRunAudit }: TechAuditOverviewProps) {
  const [isLlmsDialogOpen, setIsLlmsDialogOpen] = useState(false);

  if (!auditData) {
    return <EmptyState onRunAudit={onRunAudit} />;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Extract schema flags from schema_summary
  const schemaSummary = auditData.schema_summary || {};
  const hasMedicalOrg = Boolean(schemaSummary.hasMedicalOrganization);
  const hasPhysician = Boolean(schemaSummary.hasPhysician);
  const hasMedicalProcedure = Boolean(schemaSummary.hasMedicalProcedure);
  const hasLocalBusiness = Boolean(schemaSummary.hasLocalBusiness);
  const hasFAQPage = Boolean(schemaSummary.hasFAQPage);

  // Extract llms.txt score and data
  const llmsTxtData = auditData.llms_txt_data || {};
  const llmsTxtScore = auditData.llms_txt_score ?? (typeof llmsTxtData.score === 'number' ? llmsTxtData.score : null);
  
  // Check if we have data to show in dialog
  const hasLlmsData = auditData.llms_txt_present && (
    (typeof llmsTxtData.summary === 'string' && llmsTxtData.summary) ||
    (Array.isArray(llmsTxtData.missing_sections) && llmsTxtData.missing_sections.length > 0) ||
    (Array.isArray(llmsTxtData.recommendations) && llmsTxtData.recommendations.length > 0) ||
    (typeof llmsTxtData.contentPreview === 'string' && llmsTxtData.contentPreview)
  );

  return (
    <div className="space-y-6">
      {/* Top Section: Status & Scores */}
      <div className="space-y-4">
        {/* Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Technical Audit
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm text-muted-foreground">
                {formatDate(auditData.created_at)}
              </span>
              <StatusBadge status={auditData.status} />
            </div>
          </div>
        </div>

        {/* Score Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <CircleGauge
                score={auditData.desktop_speed_score}
                label="Desktop Speed"
                size="md"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <CircleGauge
                score={auditData.mobile_speed_score}
                label="Mobile Speed"
                size="md"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <CircleGauge
                score={llmsTxtScore}
                label="LLMS.txt Score"
                size="md"
                onClick={hasLlmsData ? () => setIsLlmsDialogOpen(true) : undefined}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Middle Section: File & Security Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Files Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              AI Files Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* llms.txt */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  llms.txt
                </span>
              </div>
              <div className="flex items-center gap-2">
                {auditData.llms_txt_present ? (
                  <>
                    <Badge variant="success">Found</Badge>
                    {llmsTxtScore !== null && (
                      <span className="text-xs text-muted-foreground">
                        Score: {Math.round(llmsTxtScore)}
                      </span>
                    )}
                  </>
                ) : (
                  <Badge variant="outline">Missing</Badge>
                )}
              </div>
            </div>

            {/* robots.txt */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                robots.txt
              </span>
              {auditData.robots_txt_present ? (
                <Badge variant="success">Found</Badge>
              ) : (
                <Badge variant="outline">Missing</Badge>
              )}
            </div>

            {/* sitemap.xml */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                sitemap.xml
              </span>
              {auditData.sitemap_present ? (
                <Badge variant="success">Found</Badge>
              ) : (
                <Badge variant="outline">Missing</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security & Access Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* HTTPS */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  HTTPS
                </span>
              </div>
              {auditData.https_enabled ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>

            {/* Mobile Friendly */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Mobile Friendly
                </span>
              </div>
              {auditData.mobile_friendly ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Schema Markup Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Structured Data (Schema.org)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* MedicalOrganization */}
            <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm font-medium text-foreground">
                MedicalOrganization
              </span>
              {hasMedicalOrg ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>

            {/* Physician */}
            <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm font-medium text-foreground">
                Physician
              </span>
              {hasPhysician ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>

            {/* MedicalProcedure */}
            <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm font-medium text-foreground">
                MedicalProcedure
              </span>
              {hasMedicalProcedure ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>

            {/* LocalBusiness */}
            <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm font-medium text-foreground">
                LocalBusiness
              </span>
              {hasLocalBusiness ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>

            {/* FAQPage */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-foreground">
                FAQPage
              </span>
              {hasFAQPage ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LLMS.txt Details Dialog */}
      {hasLlmsData && (
        <LlmsTxtDetailsDialog
          open={isLlmsDialogOpen}
          onOpenChange={setIsLlmsDialogOpen}
          llmsTxtData={llmsTxtData}
        />
      )}
    </div>
  );
}

