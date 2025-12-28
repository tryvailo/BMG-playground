'use client';

import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import { ArrowUp, ArrowDown, Target, Share2, Zap, List, Settings, FileText, Shield, MapPin, Activity, TrendingUp, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { EmptyState, EmptyStateHeading, EmptyStateText } from '@kit/ui/empty-state';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@kit/ui/chart';
import { Skeleton } from '@kit/ui/skeleton';
import { Badge } from '@kit/ui/badge';
import { cn } from '@kit/ui/utils';
import { KpiCard } from './shared/KpiCard';
import { SectionHeader } from './shared/SectionHeader';

// --- Premium 2026 Light Tokens ---
const TOKENS = {
  colors: {
    c1: '#3b82f6', // Blue
    c2: '#8b5cf6', // Violet
    c3: '#10b981', // Emerald
    c4: '#f59e0b', // Amber
    c5: '#0ea5e9', // Sky
    c6: '#6366f1', // Indigo
  },
  shadows: {
    soft: 'shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
    deep: 'shadow-[0_20px_50px_rgba(0,0,0,0.06)]',
  }
};

// --- Custom Modern Components ---
const BentoCard = ({ children, className, title, subtitle }: any) => (
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
          {!data.isCurrent && data.x <= 3 && (
            <span className="ml-2 text-xs px-2 py-0.5 bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400 rounded">
              Top Competitor
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


export function DashboardView({ data, loading = false }: DashboardViewProps) {
  const { metrics, trend, competitors } = data;

  // Calculate domain with padding for X axis (inverted: max -> min)
  const getXDomain = () => {
    if (competitors.length === 0) return [10, 1];
    const positions = competitors.map(c => c.x).filter(x => x > 0);
    if (positions.length === 0) return [10, 1];
    const min = Math.min(...positions);
    const max = Math.max(...positions);
    const padding = (max - min) * 0.1 || 0.5;
    return [Math.ceil(max + padding), Math.floor(Math.max(0.5, min - padding))];
  };

  // Calculate domain with padding for Y axis
  const getYDomain = () => {
    if (competitors.length === 0) return [0, 100];
    const scores = competitors.map(c => c.y).filter(y => y >= 0);
    if (scores.length === 0) return [0, 100];
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const padding = (max - min) * 0.1 || 5;
    return [Math.max(0, Math.floor(min - padding)), Math.min(100, Math.ceil(max + padding))];
  };

  // Calculate overall ClinicAI Score
  const overallScore = metrics.clinicAiScore?.value || 0;

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-700';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get score background color
  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-50 border-emerald-300';
    if (score >= 50) return 'bg-orange-50 border-orange-300';
    return 'bg-red-50 border-red-300';
  };

  // Calculate Quick Wins - areas with highest improvement potential
  const quickWins = useMemo(() => {
    const categories = [
      {
        name: 'Tech Optimization',
        score: metrics.techOptimization?.value || 0,
        weight: 0.2,
        icon: Settings,
        color: TOKENS.colors.c1,
      },
      {
        name: 'Content Optimization',
        score: metrics.contentOptimization?.value || 0,
        weight: 0.2,
        icon: FileText,
        color: TOKENS.colors.c2,
      },
      {
        name: 'E-E-A-T Signal',
        score: metrics.eeatSignal?.value || 0,
        weight: 0.15,
        icon: Shield,
        color: TOKENS.colors.c4,
      },
      {
        name: 'Local Signal',
        score: metrics.localSignal?.value || 0,
        weight: 0.1,
        icon: MapPin,
        color: TOKENS.colors.c3,
      },
    ];

    // Calculate potential impact: (100 - currentScore) * weight
    const withImpact = categories.map(cat => ({
      ...cat,
      potentialImpact: (100 - cat.score) * cat.weight,
      currentScore: cat.score,
    }));

    // Sort by potential impact (highest first)
    return withImpact
      .sort((a, b) => b.potentialImpact - a.potentialImpact)
      .slice(0, 3)
      .map((win, index) => ({
        ...win,
        rank: index + 1,
        estimatedGain: Math.round(win.potentialImpact * 10) / 10,
      }));
  }, [metrics]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-[24px]" />)}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-40 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-[24px]" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <EmptyState className="bg-white/30 backdrop-blur-3xl border border-white/40 rounded-[32px] p-16 shadow-2xl animate-in zoom-in-95 duration-1000">
          <EmptyStateHeading className="text-xl font-black uppercase tracking-[0.2em] italic">Завантаження</EmptyStateHeading>
          <EmptyStateText className="font-bold opacity-40 text-xs uppercase tracking-widest mt-2">Виконуємо глибокий AI аналіз ваших даних</EmptyStateText>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-in fade-in slide-in-from-bottom-2 duration-1000">
      {/* Hero Summary Dashboard */}
      <BentoCard className={cn('border-2 relative overflow-hidden bg-white', getScoreBgColor(overallScore))}>
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
          <Zap className="w-24 h-24" />
        </div>
        <CardHeader>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 mb-2">
                AI Visibility Dashboard
              </h1>
              <p className="text-sm font-medium text-slate-700">
                Comprehensive AI visibility and performance analysis
              </p>
            </div>
            <div className="text-center">
              <div className={cn('text-5xl font-black italic tracking-tighter mb-1', getScoreColor(overallScore))}>
                {overallScore.toFixed(1)}
              </div>
              <div className="text-sm font-bold text-slate-600">
                / 100
              </div>
            </div>
          </div>

          {/* Category Progress Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tech</span>
                <span className="text-xs font-black text-slate-900">{(metrics.techOptimization?.value || 0).toFixed(1)}%</span>
              </div>
              <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden relative border border-slate-300">
                <div
                  className={cn(
                    'transition-all duration-500 ease-out rounded-full shadow-sm h-full',
                    (metrics.techOptimization?.value || 0) >= 90 ? 'bg-emerald-600' : (metrics.techOptimization?.value || 0) >= 50 ? 'bg-orange-500' : 'bg-red-600'
                  )}
                  style={{ width: `${metrics.techOptimization?.value || 0}%`, minWidth: (metrics.techOptimization?.value || 0) > 0 ? '4px' : '0' }}
                />
              </div>
            </div>
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Content</span>
                <span className="text-xs font-black text-slate-900">{(metrics.contentOptimization?.value || 0).toFixed(1)}%</span>
              </div>
              <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden relative border border-slate-300">
                <div
                  className={cn(
                    'transition-all duration-500 ease-out rounded-full shadow-sm h-full',
                    (metrics.contentOptimization?.value || 0) >= 90 ? 'bg-emerald-600' : (metrics.contentOptimization?.value || 0) >= 50 ? 'bg-orange-500' : 'bg-red-600'
                  )}
                  style={{ width: `${metrics.contentOptimization?.value || 0}%`, minWidth: (metrics.contentOptimization?.value || 0) > 0 ? '4px' : '0' }}
                />
              </div>
            </div>
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">E-E-A-T</span>
                <span className="text-xs font-black text-slate-900">{(metrics.eeatSignal?.value || 0).toFixed(1)}%</span>
              </div>
              <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden relative border border-slate-300">
                <div
                  className={cn(
                    'transition-all duration-500 ease-out rounded-full shadow-sm h-full',
                    (metrics.eeatSignal?.value || 0) >= 90 ? 'bg-emerald-600' : (metrics.eeatSignal?.value || 0) >= 50 ? 'bg-orange-500' : 'bg-red-600'
                  )}
                  style={{ width: `${metrics.eeatSignal?.value || 0}%`, minWidth: (metrics.eeatSignal?.value || 0) > 0 ? '4px' : '0' }}
                />
              </div>
            </div>
            <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Local</span>
                <span className="text-xs font-black text-slate-900">{(metrics.localSignal?.value || 0).toFixed(1)}%</span>
              </div>
              <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden relative border border-slate-300">
                <div
                  className={cn(
                    'transition-all duration-500 ease-out rounded-full shadow-sm h-full',
                    (metrics.localSignal?.value || 0) >= 90 ? 'bg-emerald-600' : (metrics.localSignal?.value || 0) >= 50 ? 'bg-orange-500' : 'bg-red-600'
                  )}
                  style={{ width: `${metrics.localSignal?.value || 0}%`, minWidth: (metrics.localSignal?.value || 0) > 0 ? '4px' : '0' }}
                />
              </div>
            </div>
          </div>
        </CardHeader>
      </BentoCard>

      {/* Quick Wins Summary */}
      {quickWins.length > 0 && (
        <BentoCard title="Quick Wins" subtitle="Top areas for improvement with highest impact potential">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickWins.map((win) => {
              const Icon = win.icon;
              return (
                <div
                  key={win.name}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg" style={{ backgroundColor: `${win.color}15` }}>
                        <Icon className="h-4 w-4" style={{ color: win.color }} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{win.name}</div>
                        <div className="text-xs text-slate-500">Current: {win.currentScore.toFixed(1)}%</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs font-bold">
                      #{win.rank}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">Potential Gain</span>
                      <span className="text-sm font-black text-emerald-600">+{win.estimatedGain.toFixed(1)} pts</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                      <div
                        className="h-full transition-all duration-500 ease-out rounded-full"
                        style={{
                          width: `${win.currentScore}%`,
                          backgroundColor: win.color,
                          minWidth: win.currentScore > 0 ? '4px' : '0',
                        }}
                      />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Improving to 100% could add {win.estimatedGain.toFixed(1)} points to your ClinicAI Score
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </BentoCard>
      )}

      <section>
        <SectionHeader
          title="Показники ефективності"
          subtitle="Фундаментальні метрики вашої видимості"
          icon={Activity}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <KpiCard
            title="Clinic AI Score"
            value={
              metrics.clinicAiScore?.value != null 
                ? (typeof metrics.clinicAiScore.value === 'number' 
                    ? metrics.clinicAiScore.value.toFixed(1) 
                    : Number(metrics.clinicAiScore.value).toFixed(1))
                : 'N/A'
            }
            trend={metrics.clinicAiScore?.trend ?? 0}
            icon={Zap}
            color="emerald"
          />
          <KpiCard
            title="Видимість послуг"
            value={
              metrics.serviceVisibility?.value != null 
                ? `${(typeof metrics.serviceVisibility.value === 'number' 
                    ? metrics.serviceVisibility.value 
                    : Number(metrics.serviceVisibility.value) || 0).toFixed(0)}%`
                : 'N/A'
            }
            trend={metrics.serviceVisibility?.trend ?? 0}
            icon={Target}
            color="green"
            subtext="AI Присутність на ринку"
          />
          <KpiCard
            title="Середня позиція"
            value={
              metrics.avgPosition?.value != null && metrics.avgPosition.value > 0
                ? (typeof metrics.avgPosition.value === 'number'
                    ? metrics.avgPosition.value.toFixed(1)
                    : Number(metrics.avgPosition.value).toFixed(1))
                : 'N/A'
            }
            trend={metrics.avgPosition?.trend ?? 0}
            icon={Share2}
            color="cyan"
            note="(Нижче — краще)"
          />
        </div>
      </section>

      <section>
        <SectionHeader
          title="Аналіз сигналів"
          subtitle="Структурна оцінка факторів ранжування"
          icon={List}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Технічна база"
            value={
              metrics.techOptimization?.value != null
                ? (typeof metrics.techOptimization.value === 'number'
                    ? metrics.techOptimization.value.toFixed(1)
                    : Number(metrics.techOptimization.value).toFixed(1))
                : 'N/A'
            }
            trend={metrics.techOptimization?.trend ?? 0}
            icon={Settings}
            color="blue"
          />
          <KpiCard
            title="Якість контенту"
            value={
              metrics.contentOptimization?.value != null
                ? (typeof metrics.contentOptimization.value === 'number'
                    ? metrics.contentOptimization.value.toFixed(1)
                    : Number(metrics.contentOptimization.value).toFixed(1))
                : 'N/A'
            }
            trend={metrics.contentOptimization?.trend ?? 0}
            icon={FileText}
            color="purple"
          />
          <KpiCard
            title="E-E-A-T фактори"
            value={
              metrics.eeatSignal?.value != null
                ? (typeof metrics.eeatSignal.value === 'number'
                    ? metrics.eeatSignal.value.toFixed(1)
                    : Number(metrics.eeatSignal.value).toFixed(1))
                : 'N/A'
            }
            trend={metrics.eeatSignal?.trend ?? 0}
            icon={Shield}
            color="orange"
          />
          <KpiCard
            title="Локальний вплив"
            value={
              metrics.localSignal?.value != null
                ? (typeof metrics.localSignal.value === 'number'
                    ? metrics.localSignal.value.toFixed(1)
                    : Number(metrics.localSignal.value).toFixed(1))
                : 'N/A'
            }
            trend={metrics.localSignal?.trend ?? 0}
            icon={MapPin}
            color="green"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        <Card className="lg:col-span-12 xl:col-span-7 bg-white/20 dark:bg-slate-950/20 backdrop-blur-3xl border-none rounded-[32px] overflow-hidden transition-all duration-1000 hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] group relative">
          <div className="absolute inset-0 border border-white/40 dark:border-white/10 rounded-[32px] pointer-events-none" />

          <CardHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Історія ClinicAI Score</CardTitle>
                <p className="text-sm font-bold text-slate-900 mt-1">Глибинна динаміка вашого авторитету</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10 shadow-[0_0_15px_rgba(var(--primary-rgb),0.05)]">
                <Activity className="h-5 w-5 text-primary animate-pulse" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            {trend.length === 0 ? (
              <EmptyState className="h-48 opacity-20">
                <EmptyStateHeading className="text-[10px] font-black uppercase tracking-widest">Збір даних...</EmptyStateHeading>
              </EmptyState>
            ) : (
              <ChartContainer
                config={{
                  score: { label: 'ClinicAI Score', color: 'hsl(var(--primary))' },
                }}
                className="h-[280px] w-full mt-2"
              >
                <AreaChart data={trend} margin={{ top: 10, right: 20, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-score)" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="var(--color-score)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} className="stroke-slate-200/40 dark:stroke-slate-800/40" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 900, fill: 'hsl(var(--muted-foreground))', opacity: 0.4 }}
                    tickFormatter={(value: string) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 900, fill: 'hsl(var(--muted-foreground))', opacity: 0.4 }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border-white/50 dark:border-white/10 rounded-2xl shadow-2xl border-none"
                        labelFormatter={(value: string) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('uk-UA', { month: 'long', day: 'numeric', year: 'numeric' });
                        }}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="var(--color-score)"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                    dot={{ stroke: 'var(--color-score)', strokeWidth: 3, fill: 'var(--color-score)', r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 4, stroke: 'white' }}
                    className="drop-shadow-[0_15px_20px_rgba(var(--primary-rgb),0.2)]"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-12 xl:col-span-5 bg-white/20 dark:bg-slate-950/20 backdrop-blur-3xl border-none rounded-[32px] overflow-hidden transition-all duration-1000 hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)] relative group">
          <div className="absolute inset-0 border border-white/40 dark:border-white/10 rounded-[32px] pointer-events-none" />

          <CardHeader className="p-6 pb-0">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Конкурентне поле</CardTitle>
            <p className="text-sm font-bold text-slate-900 mt-1">Ваше місце у екосистемі ринку</p>
          </CardHeader>
          <CardContent className="p-6 pt-4 relative min-h-[360px]">
            <div className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.05] flex flex-wrap p-8 pt-16">
              <div className="w-1/2 h-1/2 border-r border-b border-slate-900 dark:border-white flex items-center justify-center">
                <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Legacy</span>
              </div>
              <div className="w-1/2 h-1/2 border-b border-slate-900 dark:border-white flex items-center justify-center">
                <span className="text-[8px] font-black uppercase tracking-widest italic">Leading</span>
              </div>
              <div className="w-1/2 h-1/2 border-r border-slate-900 dark:border-white flex items-center justify-center">
                <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Niche</span>
              </div>
              <div className="w-1/2 h-1/2 flex items-center justify-center">
                <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Challengers</span>
              </div>
            </div>

            {competitors.length <= 1 ? (
              <EmptyState className="h-48 opacity-20">
                <EmptyStateHeading className="text-[10px] font-black uppercase tracking-widest">Немає лідерів</EmptyStateHeading>
              </EmptyState>
            ) : (
              <>
                <ChartContainer
                  config={{
                    current: { label: 'Ваша Клініка', color: 'hsl(var(--primary))' },
                    competitor: { label: 'Ринкове поле', color: 'hsl(var(--muted-foreground))' },
                    topCompetitor: { label: 'Лідери', color: '#f97316' },
                  }}
                  className="h-[240px] mt-6"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -25 }}>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} className="stroke-slate-200/40 dark:stroke-slate-800/40" />
                      <XAxis
                        type="number"
                        dataKey="x"
                        name="Avg Position"
                        domain={getXDomain()}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fontWeight: 900, fill: 'hsl(var(--muted-foreground))', opacity: 0.4 }}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        name="ClinicAI Score"
                        domain={getYDomain()}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fontWeight: 900, fill: 'hsl(var(--muted-foreground))', opacity: 0.4 }}
                      />
                      <ZAxis dataKey="z" range={[100, 600]} />
                      <ChartTooltip content={<CompetitorScatterTooltip />} />
                      <Scatter name="Competitors" data={competitors}>
                        {competitors.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.isCurrent ? 'var(--color-current)' : entry.x <= 3 ? 'var(--color-topCompetitor)' : 'var(--color-competitor)'}
                            className="transition-all duration-1000 hover:scale-[1.6] cursor-pointer drop-shadow-xl"
                            strokeWidth={entry.isCurrent ? 4 : 0}
                            stroke="white"
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </ChartContainer>

                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8 text-[8px] font-black uppercase tracking-[0.15em] italic">
                  {[
                    { label: 'Ваша Клініка', color: 'var(--color-current)' },
                    { label: 'Лідери ринку', color: 'var(--color-topCompetitor)' },
                    { label: 'Інші гравці', color: 'var(--color-competitor)' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-white/10 shadow-md">
                      <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.05)] animate-pulse" style={{ backgroundColor: item.color }}></div>
                      <span className="text-slate-800 dark:text-slate-200">{item.label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
