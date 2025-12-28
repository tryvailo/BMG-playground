'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Info,
  ArrowUp,
  ArrowDown,
  Target,
  Zap,
  Shield,
  FileText,
  Settings,
  MapPin,
  ChevronDown,
  Loader2,
  Play,
  Pause,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@kit/ui/collapsible';
import {
  EmptyState,
  EmptyStateHeading,
  EmptyStateText,
  EmptyStateButton,
} from '@kit/ui/empty-state';
import { Skeleton } from '@kit/ui/skeleton';
import { cn } from '@kit/ui/utils';
import { getMetricColorVariant, type MetricColorVariant } from '~/lib/design/metric-colors';

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
 * Metric Card Component
 */
interface MetricCardProps {
  title: string;
  value: string;
  trend?: number;
  icon: React.ElementType;
  variant: MetricColorVariant;
  note?: string;
}

function MetricCard({ title, value, trend, icon: Icon, variant, note }: MetricCardProps) {
  const colors = getMetricColorVariant(variant);
  const isPositive = trend !== undefined && trend >= 0;
  const trendAbs = trend !== undefined ? Math.abs(trend) : 0;
  const trendDisplay = trendAbs > 0 && trend !== undefined ? `${isPositive ? '+' : ''}${trend.toFixed(1)}%` : null;

  return (
    <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-lg', colors.bg)}>
          <Icon className={cn('h-4 w-4', colors.icon)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
        {trendDisplay && (
          <div className="flex items-center mt-4 text-xs">
            {isPositive ? (
              <ArrowUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400 mr-1" />
            ) : (
              <ArrowDown className="h-3 w-3 text-red-600 dark:text-red-400 mr-1" />
            )}
            <span
              className={cn(
                'font-medium',
                isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400',
              )}
            >
              {trendDisplay}
            </span>
            <span className="text-muted-foreground ml-2">vs last month</span>
          </div>
        )}
        {note && !trendDisplay && (
          <p className="text-xs text-muted-foreground mt-2">{note}</p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Status Card Component
 */
interface StatusCardProps {
  title: string;
  icon?: React.ReactNode;
  status: 'good' | 'bad' | 'warning' | 'neutral';
  value?: string | number | React.ReactNode;
  score?: number | null;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

function StatusCard({ 
  title, 
  icon, 
  status, 
  value, 
  score,
  children, 
  defaultOpen = false 
}: StatusCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

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
                  <span className="text-foreground font-semibold">
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

export function DesignShowcase() {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Design System Showcase
        </h1>
        <p className="text-muted-foreground">
          Примеры всех элементов нового дизайна с системными токенами Makerkit
        </p>
      </div>

      {/* KPI Cards Section */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">KPI Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Clinic AI Score"
            value="87.5"
            trend={5.2}
            icon={Target}
            variant="success"
          />
          <MetricCard
            title="Service Visibility"
            value="234"
            trend={-2.1}
            icon={Zap}
            variant="info"
          />
          <MetricCard
            title="Tech Optimization"
            value="92%"
            trend={3.5}
            icon={Settings}
            variant="warning"
          />
          <MetricCard
            title="E-E-A-T Signal"
            value="78"
            trend={0}
            icon={Shield}
            variant="purple"
            note="No change"
          />
        </div>
      </section>

      {/* Progress Bars Section */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Progress Bars</h2>
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Examples of progress bars with different values</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ProgressBar value={95} label="Excellent Score" size="md" />
            <ProgressBar value={75} label="Good Score" size="md" />
            <ProgressBar value={45} label="Warning Score" size="md" />
            <ProgressBar value={25} label="Low Score" size="md" />
            <ProgressBar value={95} label="Small Size" size="sm" />
            <ProgressBar value={75} label="Large Size" size="lg" />
          </CardContent>
        </Card>
      </section>

      {/* Status Cards Section */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Status Cards</h2>
        <div className="space-y-4">
          <StatusCard
            title="Desktop Speed"
            icon={<Zap className="h-5 w-5" />}
            status="good"
            score={95}
            value="95/100"
          >
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong className="text-foreground">LCP:</strong> 1.2s</p>
              <p><strong className="text-foreground">FCP:</strong> 0.8s</p>
              <p><strong className="text-foreground">CLS:</strong> 0.05</p>
            </div>
          </StatusCard>

          <StatusCard
            title="Mobile Speed"
            icon={<Zap className="h-5 w-5" />}
            status="warning"
            score={65}
            value="65/100"
          >
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong className="text-foreground">LCP:</strong> 3.5s</p>
              <p><strong className="text-foreground">FCP:</strong> 2.1s</p>
              <p><strong className="text-foreground">CLS:</strong> 0.15</p>
            </div>
          </StatusCard>

          <StatusCard
            title="HTTPS"
            icon={<Shield className="h-5 w-5" />}
            status="good"
            value="Enabled"
          >
            <p className="text-sm text-muted-foreground">
              Your site is using HTTPS encryption for secure connections.
            </p>
          </StatusCard>

          <StatusCard
            title="Missing robots.txt"
            icon={<FileText className="h-5 w-5" />}
            status="bad"
            value="Missing"
          >
            <p className="text-sm text-muted-foreground">
              robots.txt file is not found. This may affect search engine crawling.
            </p>
          </StatusCard>
        </div>
      </section>

      {/* Buttons Section */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Buttons</h2>
        <Card>
          <CardHeader>
            <CardTitle>Button Variants</CardTitle>
            <CardDescription>Different button styles and states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button>Default Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button disabled>Disabled</Button>
              <Button>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading
              </Button>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                With Icon
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Badges Section */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Badges</h2>
        <Card>
          <CardHeader>
            <CardTitle>Badge Variants</CardTitle>
            <CardDescription>Status indicators and labels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                Success
              </Badge>
              <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                Warning
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                Info
              </Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Alerts Section */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Alerts</h2>
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              This is an informational alert using system tokens.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              This is an error alert for important issues.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Empty States Section */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Empty States</h2>
        <Card>
          <CardContent className="pt-6">
            <EmptyState>
              <EmptyStateHeading>No data available</EmptyStateHeading>
              <EmptyStateText>
                Start by running an audit to see results here.
              </EmptyStateText>
              <EmptyStateButton onClick={() => setIsLoading(!isLoading)}>
                <Play className="h-4 w-4 mr-2" />
                Run Audit
              </EmptyStateButton>
            </EmptyState>
          </CardContent>
        </Card>
      </section>

      {/* Loading States Section */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Loading States</h2>
        <Card>
          <CardHeader>
            <CardTitle>Loading Examples</CardTitle>
            <CardDescription>Skeleton loaders and spinners</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Color Variants Section */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Color Variants</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(['success', 'warning', 'info', 'purple', 'cyan', 'primary'] as MetricColorVariant[]).map((variant) => {
            const colors = getMetricColorVariant(variant);
            return (
              <Card key={variant}>
                <CardHeader>
                  <CardTitle className="capitalize">{variant}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn('p-4 rounded-lg mb-3', colors.bg)}>
                    <div className={cn('text-lg font-semibold', colors.text)}>
                      Sample Text
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Background:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{colors.bg}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Text:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{colors.text}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Icon:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{colors.icon}</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* System Tokens Section */}
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">System Tokens</h2>
        <Card>
          <CardHeader>
            <CardTitle>Design Tokens</CardTitle>
            <CardDescription>System colors that adapt to light/dark themes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="h-12 bg-background border border-border rounded-lg flex items-center justify-center">
                  <span className="text-xs text-foreground">background</span>
                </div>
                <code className="text-xs text-muted-foreground block">bg-background</code>
              </div>
              <div className="space-y-2">
                <div className="h-12 bg-card border border-border rounded-lg flex items-center justify-center">
                  <span className="text-xs text-card-foreground">card</span>
                </div>
                <code className="text-xs text-muted-foreground block">bg-card</code>
              </div>
              <div className="space-y-2">
                <div className="h-12 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">muted</span>
                </div>
                <code className="text-xs text-muted-foreground block">bg-muted</code>
              </div>
              <div className="space-y-2">
                <div className="h-12 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-xs text-primary-foreground">primary</span>
                </div>
                <code className="text-xs text-muted-foreground block">bg-primary</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

