/**
 * PeriodComparison Component
 * Week 5, Days 4-5: Compare metrics between two periods
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@kit/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import { Skeleton } from '@kit/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  ArrowRight,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

interface PeriodMetrics {
  startDate: string;
  endDate: string;
  avgClinicAIScore: number;
  avgVisibility: number;
  avgTechScore: number;
  avgContentScore: number;
  avgEeatScore: number;
  avgLocalScore: number;
  servicesCount: number;
  visibleServicesCount: number;
}

interface ComparisonData {
  period1: PeriodMetrics;
  period2: PeriodMetrics;
  changes: Record<string, number>;
  percentChanges: Record<string, number>;
  summary: string;
}

interface PeriodComparisonProps {
  projectId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type PresetType = 'week' | 'month' | 'quarter';

export function PeriodComparison({
  projectId,
  open = false,
  onOpenChange,
}: PeriodComparisonProps) {
  const [preset, setPreset] = useState<PresetType>('week');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ComparisonData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = async (selectedPreset: PresetType) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/dashboard/compare?projectId=${projectId}&preset=${selectedPreset}`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch comparison data');
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && projectId) {
      fetchComparison(preset);
    }
  }, [open, projectId, preset]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const _getChangeIcon = (value: number) => {
    if (value > 2) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < -2) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const _getChangeBadge = (_value: number) => {
    return null;
  };

  const presetLabels: Record<PresetType, { label: string; description: string }> = {
    week: { label: 'Weekly', description: 'This week vs last week' },
    month: { label: 'Monthly', description: 'This month vs last month' },
    quarter: { label: 'Quarterly', description: 'This quarter vs last quarter' },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Period Comparison
          </DialogTitle>
          <DialogDescription>
            Compare your metrics between different time periods
          </DialogDescription>
        </DialogHeader>

        {/* Period Selection */}
        <Tabs
          value={preset}
          onValueChange={(v) => setPreset(v as PresetType)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">Weekly</TabsTrigger>
            <TabsTrigger value="month">Monthly</TabsTrigger>
            <TabsTrigger value="quarter">Quarterly</TabsTrigger>
          </TabsList>

          <TabsContent value={preset} className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
              {presetLabels[preset].description}
            </p>

            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
                <Skeleton className="h-48 w-full" />
              </div>
            ) : error ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button
                    variant="outline"
                    onClick={() => fetchComparison(preset)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : data ? (
              <div className="space-y-6">
                {/* Summary */}
                <Card className="bg-muted/50">
                  <CardContent className="py-4">
                    <p className="text-sm">{data.summary}</p>
                  </CardContent>
                </Card>

                {/* Period Headers */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Period 1
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(data.period1.startDate)} - {formatDate(data.period1.endDate)}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Period 2 (Current)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(data.period2.startDate)} - {formatDate(data.period2.endDate)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Metrics Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Metrics Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* ClinicAI Score */}
                      <MetricRow
                        label="ClinicAI Score"
                        value1={data.period1.avgClinicAIScore}
                        value2={data.period2.avgClinicAIScore}
                        change={data.percentChanges.clinicAIScore ?? 0}
                        suffix=""
                      />

                      {/* Visibility */}
                      <MetricRow
                        label="Visibility"
                        value1={data.period1.avgVisibility}
                        value2={data.period2.avgVisibility}
                        change={data.percentChanges.visibility ?? 0}
                        suffix="%"
                      />

                      {/* Tech Score */}
                      <MetricRow
                        label="Tech Score"
                        value1={data.period1.avgTechScore}
                        value2={data.period2.avgTechScore}
                        change={data.percentChanges.techScore ?? 0}
                        suffix="%"
                      />

                      {/* Content Score */}
                      <MetricRow
                        label="Content Score"
                        value1={data.period1.avgContentScore}
                        value2={data.period2.avgContentScore}
                        change={data.percentChanges.contentScore ?? 0}
                        suffix="%"
                      />

                      {/* E-E-A-T Score */}
                      <MetricRow
                        label="E-E-A-T Score"
                        value1={data.period1.avgEeatScore}
                        value2={data.period2.avgEeatScore}
                        change={data.percentChanges.eeatScore ?? 0}
                        suffix="%"
                      />

                      {/* Local Score */}
                      <MetricRow
                        label="Local Score"
                        value1={data.period1.avgLocalScore}
                        value2={data.period2.avgLocalScore}
                        change={data.percentChanges.localScore ?? 0}
                        suffix="%"
                      />

                      {/* Services Count */}
                      <MetricRow
                        label="Total Services"
                        value1={data.period1.servicesCount}
                        value2={data.period2.servicesCount}
                        change={data.percentChanges.servicesCount ?? 0}
                        suffix=""
                        isCount
                      />

                      {/* Visible Services */}
                      <MetricRow
                        label="Visible Services"
                        value1={data.period1.visibleServicesCount}
                        value2={data.period2.visibleServicesCount}
                        change={data.percentChanges.visibleServicesCount ?? 0}
                        suffix=""
                        isCount
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

interface MetricRowProps {
  label: string;
  value1: number;
  value2: number;
  change: number;
  suffix: string;
  isCount?: boolean;
}

function MetricRow({ label, value1, value2, change, suffix, isCount }: MetricRowProps) {
  const formatValue = (val: number) => {
    if (isCount) return val.toString();
    return val.toFixed(1);
  };

  const getChangeColor = () => {
    if (change > 5) return 'text-green-600';
    if (change < -5) return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground w-16 text-right">
          {formatValue(value1)}{suffix}
        </span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium w-16 text-right">
          {formatValue(value2)}{suffix}
        </span>
        <div className={`flex items-center gap-1 w-20 justify-end ${getChangeColor()}`}>
          {change > 2 && <TrendingUp className="h-3 w-3" />}
          {change < -2 && <TrendingDown className="h-3 w-3" />}
          <span className="text-xs">
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Trigger button for opening the comparison dialog
 */
export function PeriodComparisonTrigger({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <BarChart3 className="h-4 w-4 mr-2" />
      Compare Periods
    </Button>
  );
}
