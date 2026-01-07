/**
 * ServiceDetails Component
 * Week 3, Days 4-5: Modal with detailed service info, graphs, and metrics
 */

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@kit/ui/dialog';
import { Badge } from '@kit/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import { Button } from '@kit/ui/button';
import { AlertCircle, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { getAIVBadgeVariant, getAIVRating } from '~/lib/modules/services/aiv-calculator';
import {
  getPageSpeedBadgeVariant,
  getPageSpeedRating,
  getMetricRating,
  formatMetric,
} from '~/lib/modules/audit/pagespeed-integration';

export interface ServiceDetailsProps {
  service?: {
    id: string;
    serviceName: string;
    targetPage: string;
    country?: string;
    city?: string;
    visibility_score?: number;
    position?: number;
    aiv_score?: number;
    pagespeed_score?: number;
    pagespeed_metrics?: {
      lcp: number;
      fcp: number;
      cls: number;
      fid: number;
      ttfb: number;
      tti: number;
    };
    schema_score?: number;
    schema_issues?: number;
    createdAt?: string;
    updatedAt?: string;
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ServiceDetails({
  service,
  open = false,
  onOpenChange,
}: ServiceDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!service) return null;

  const metrics = service.pagespeed_metrics;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{service.serviceName}</DialogTitle>
          <DialogDescription>{service.targetPage}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pagespeed">PageSpeed</TabsTrigger>
            <TabsTrigger value="schema">Schema</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              {/* Visibility */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Visibility Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3">
                    <span className="text-3xl font-bold">
                      {(service.visibility_score ?? 0).toFixed(0)}%
                    </span>
                    <Badge
                      variant={
                        (service.visibility_score ?? 0) > 0 ? 'success' : 'secondary'
                      }
                    >
                      {(service.visibility_score ?? 0) > 0 ? 'Visible' : 'Hidden'}
                    </Badge>
                  </div>
                  {service.position && (
                    <div className="text-sm text-muted-foreground mt-2">
                      Position: #{service.position}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AIV Score */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">AIV Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3">
                    <span className="text-3xl font-bold">
                      {service.aiv_score?.toFixed(1) ?? '—'}
                    </span>
                    {service.aiv_score !== undefined && (
                      <Badge variant={getAIVBadgeVariant(service.aiv_score)}>
                        {getAIVRating(service.aiv_score)}
                      </Badge>
                    )}
                  </div>
                  {service.aiv_score !== undefined && (
                    <div className="text-sm text-muted-foreground mt-2">
                      Score out of 100
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Location Info */}
            {(service.city || service.country) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Location</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>
                    📍 {service.city}
                    {service.city && service.country && ', '}
                    {service.country}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Service Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Service Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Name:</span>
                  <span className="font-medium">{service.serviceName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">URL:</span>
                  <a
                    href={service.targetPage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate max-w-xs"
                  >
                    {service.targetPage}
                  </a>
                </div>
                {service.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">
                      {new Date(service.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PageSpeed Tab */}
          <TabsContent value="pagespeed" className="space-y-4 mt-4">
            {service.pagespeed_score !== undefined ? (
              <>
                {/* Overall Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">PageSpeed Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold">
                        {service.pagespeed_score}
                      </div>
                      <Badge variant={getPageSpeedBadgeVariant(service.pagespeed_score)}>
                        {getPageSpeedRating(service.pagespeed_score)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Metrics */}
                {metrics && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Web Vitals</CardTitle>
                      <CardDescription>Core metrics from Google PageSpeed Insights</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* LCP */}
                      <MetricRow
                        label="Largest Contentful Paint (LCP)"
                        value={metrics.lcp}
                        metric="lcp"
                        unit="ms"
                      />

                      {/* FCP */}
                      <MetricRow
                        label="First Contentful Paint (FCP)"
                        value={metrics.fcp}
                        metric="fcp"
                        unit="ms"
                      />

                      {/* CLS */}
                      <MetricRow
                        label="Cumulative Layout Shift (CLS)"
                        value={metrics.cls}
                        metric="cls"
                        unit=""
                      />

                      {/* FID */}
                      <MetricRow
                        label="First Input Delay (FID)"
                        value={metrics.fid}
                        metric="fid"
                        unit="ms"
                      />

                      {/* TTFB */}
                      <MetricRow
                        label="Time to First Byte (TTFB)"
                        value={metrics.ttfb}
                        metric="ttfb"
                        unit="ms"
                      />

                      {/* TTI */}
                      <MetricRow
                        label="Time to Interactive (TTI)"
                        value={metrics.tti}
                        metric="tti"
                        unit="ms"
                      />
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    No PageSpeed data available. Click the button below to scan.
                  </div>
                  <Button className="w-full mt-4">Scan PageSpeed</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Schema Tab */}
          <TabsContent value="schema" className="space-y-4 mt-4">
            {service.schema_score !== undefined ? (
              <>
                {/* Schema Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Schema.org Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold">{service.schema_score}%</div>
                      <Badge variant={service.schema_score >= 50 ? 'success' : 'warning'}>
                        {service.schema_score >= 75
                          ? 'Excellent'
                          : service.schema_score >= 50
                            ? 'Good'
                            : 'Needs Improvement'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Issues */}
                {service.schema_issues ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{service.schema_issues} issues to resolve</span>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>All schemas validated</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">View Full Report</Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    No schema data available. Click the button below to audit.
                  </div>
                  <Button className="w-full mt-4">Audit Schema</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Performance History</CardTitle>
                <CardDescription>Last 30 days</CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>History graph coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Metric Row Component
 */
interface MetricRowProps {
  label: string;
  value: number;
  metric: 'lcp' | 'fcp' | 'cls' | 'fid' | 'ttfb' | 'tti';
  unit: string;
}

function MetricRow({ label, value, metric, unit: _unit }: MetricRowProps) {
  const rating = getMetricRating(metric, value);
  const statusColor =
    rating === 'good' ? 'text-green-600' : rating === 'needs-improvement' ? 'text-amber-600' : 'text-red-600';
  const statusIcon =
    rating === 'good' ? (
      <CheckCircle className="w-4 h-4" />
    ) : rating === 'needs-improvement' ? (
      <AlertTriangle className="w-4 h-4" />
    ) : (
      <AlertCircle className="w-4 h-4" />
    );

  return (
    <div className="flex items-center justify-between pb-3 border-b last:border-b-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground capitalize">{rating}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold">
          {formatMetric(metric, value)}
        </span>
        <span className={`${statusColor}`}>{statusIcon}</span>
      </div>
    </div>
  );
}
