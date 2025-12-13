'use client';

import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import { ArrowUp, ArrowDown, Target, Share2, Zap, List, Settings, FileText, Shield, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { EmptyState, EmptyStateHeading, EmptyStateText } from '@kit/ui/empty-state';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@kit/ui/chart';
import { Skeleton } from '@kit/ui/skeleton';
import { cn } from '@kit/ui/utils';
import { getMetricColorVariant, type MetricColorVariant } from '~/lib/design/metric-colors';

export interface DashboardData {
  metrics: {
    // Top Row (Main KPIs)
    clinicAiScore: { value: number; trend: number };
    serviceVisibility: { value: number; trend: number };
    avgPosition: { value: number; trend: number };
    
    // Second Row (Breakdown)
    techOptimization: { value: number; trend: number };
    contentOptimization: { value: number; trend: number };
    eeatSignal: { value: number; trend: number };
    localSignal: { value: number; trend: number };
  };
  trend: Array<{ date: string; score: number }>;
  competitors: Array<{ name: string; x: number; y: number; isCurrent: boolean; z?: number }>;
}

interface DashboardViewProps {
  data: DashboardData;
  loading?: boolean;
}

/**
 * Custom Tooltip for Competitor Scatter Chart
 */
interface CompetitorScatterTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      x: number;
      y: number;
      isCurrent: boolean;
    };
  }>;
}

const CompetitorScatterTooltip: React.FC<CompetitorScatterTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-card text-card-foreground p-3 rounded-lg border border-border shadow-lg">
        <p className="text-sm font-semibold mb-2">
          {data.name}
          {data.isCurrent && (
            <span className="ml-2 text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded">
              Your Clinic
            </span>
          )}
        </p>
        <div className="space-y-1 text-xs">
          <p className="text-muted-foreground">
            <span className="font-medium">Pos:</span>{' '}
            <span className="text-foreground">{data.x.toFixed(1)}</span>
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium">Score:</span>{' '}
            <span className="text-foreground">{data.y.toFixed(1)}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

interface KpiCardProps {
  title: string;
  value: string;
  trend: number;
  icon: React.ElementType;
  color: string;
  note?: string;
  subtext?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, trend, icon: Icon, color, note, subtext }) => {
  // Map old color names to new metric color variants
  const colorMap: Record<string, MetricColorVariant> = {
    emerald: 'success',
    green: 'success',
    cyan: 'cyan',
    orange: 'warning',
    blue: 'info',
    purple: 'purple',
  };

  const variant = colorMap[color] || 'primary';
  const colors = getMetricColorVariant(variant);

  const isPositive = trend >= 0;
  const trendAbs = Math.abs(trend);
  const trendDisplay = trendAbs > 0 ? `${isPositive ? '+' : ''}${trend.toFixed(1)}%` : null;

  return (
    <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20 animate-fade-up">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-lg transition-colors', colors.bg)}>
          <Icon className={cn('h-4 w-4', colors.icon)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
        {subtext && trendAbs === 0 && (
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        )}
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
};

/**
 * Pure Dashboard View Component
 * 
 * This component displays KPI cards, trend chart, and competitor scatter plot.
 * It accepts a simple data structure and renders the UI without any data fetching logic.
 */
export function DashboardView({ data, loading = false }: DashboardViewProps) {
  const { metrics, trend, competitors } = data;

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Top Row: Main KPIs Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Second Row: Breakdown Metrics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-72 w-full rounded-lg" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-72 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <EmptyState>
        <EmptyStateHeading>Завантаження даних...</EmptyStateHeading>
        <EmptyStateText>Будь ласка, зачекайте поки дані завантажуються</EmptyStateText>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Row: Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard 
          title="Середній Clinic AI Score" 
          value={metrics.clinicAiScore?.value?.toFixed(1) ?? 'N/A'} 
          trend={metrics.clinicAiScore?.trend ?? 0}
          icon={Zap}
          color="emerald"
        />
        <KpiCard 
          title="Відимість послуг" 
          value={metrics.serviceVisibility?.value != null ? `${metrics.serviceVisibility.value.toFixed(0)}%` : 'N/A'} 
          trend={metrics.serviceVisibility?.trend ?? 0}
          icon={Target}
          color="green"
          subtext="Based on AI presence"
        />
        <KpiCard 
          title="Середня позиція" 
          value={metrics.avgPosition?.value != null && metrics.avgPosition.value > 0 ? metrics.avgPosition.value.toFixed(1) : 'N/A'} 
          trend={metrics.avgPosition?.trend ?? 0}
          icon={Share2}
          color="cyan"
          note="(Lower is better)"
        />
      </div>

      {/* Second Row: Breakdown Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Технічна оптимізація" 
          value={metrics.techOptimization?.value?.toFixed(1) ?? 'N/A'} 
          trend={metrics.techOptimization?.trend ?? 0}
          icon={Settings}
          color="blue"
        />
        <KpiCard 
          title="Оптимізація контенту" 
          value={metrics.contentOptimization?.value?.toFixed(1) ?? 'N/A'} 
          trend={metrics.contentOptimization?.trend ?? 0}
          icon={FileText}
          color="purple"
        />
        <KpiCard 
          title="E-E-A-T сигнали" 
          value={metrics.eeatSignal?.value?.toFixed(1) ?? 'N/A'} 
          trend={metrics.eeatSignal?.trend ?? 0}
          icon={Shield}
          color="orange"
        />
        <KpiCard 
          title="Локальні показники" 
          value={metrics.localSignal?.value?.toFixed(1) ?? 'N/A'} 
          trend={metrics.localSignal?.trend ?? 0}
          icon={MapPin}
          color="green"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trend Chart */}
        <Card className="lg:col-span-2 transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle>AIV Score History</CardTitle>
          </CardHeader>
          <CardContent>
            {trend.length === 0 ? (
              <EmptyState className="h-72">
                <EmptyStateHeading>Not enough data</EmptyStateHeading>
                <EmptyStateText>Not enough data for trend analysis</EmptyStateText>
              </EmptyState>
            ) : (
              <ChartContainer
                config={{
                  score: {
                    label: 'ClinicAI Score',
                    color: 'hsl(var(--chart-1))',
                  },
                }}
                className="h-72"
              >
                <AreaChart data={trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-score)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--color-score)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(value: string) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      });
                    }}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value: string) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          });
                        }}
                        formatter={(value: number) => [
                          `${value.toFixed(1)}`,
                          'ClinicAI Score'
                        ]}
                      />
                    }
                  />
                  <Area 
                    type={trend.length === 1 ? 'linear' : 'monotone'}
                    dataKey="score" 
                    stroke="var(--color-score)" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorScore)"
                    dot={{ fill: 'var(--color-score)', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Competitor Landscape Scatter Chart */}
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle>Competitor Landscape</CardTitle>
          </CardHeader>
          <CardContent>
            {competitors.length <= 1 ? (
              <EmptyState className="h-72">
                <EmptyStateHeading>No competitors</EmptyStateHeading>
                <EmptyStateText>No competitors found for comparison</EmptyStateText>
              </EmptyState>
            ) : (
              <>
                <ChartContainer
                  config={{
                    current: {
                      label: 'Your Clinic',
                      color: 'hsl(var(--chart-2))',
                    },
                    competitor: {
                      label: 'Competitors',
                      color: 'hsl(var(--muted-foreground))',
                    },
                  }}
                  className="h-72"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                      <XAxis 
                        type="number"
                        dataKey="x"
                        name="Avg Position"
                        domain={[10, 1]} // Inverted: 10 (left) -> 1 (right)
                        axisLine={false}
                        tickLine={false}
                        label={{ 
                          value: 'Avg Position', 
                          position: 'insideBottom', 
                          offset: -5,
                        }}
                      />
                      <YAxis 
                        type="number"
                        dataKey="y"
                        name="ClinicAI Score"
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        label={{ 
                          value: 'ClinicAI Score', 
                          angle: -90, 
                          position: 'insideLeft',
                        }}
                      />
                      <ZAxis dataKey="z" range={[60, 400]} />
                      <ChartTooltip content={<CompetitorScatterTooltip />} />
                      <Scatter name="Competitors" data={competitors}>
                        {competitors.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.isCurrent ? 'var(--color-current)' : 'var(--color-competitor)'}
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--color-current)' }}></div>
                    <span>Your Clinic</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--color-competitor)' }}></div>
                    <span>Competitors</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

