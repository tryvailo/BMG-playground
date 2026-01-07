'use client';

import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell, LabelList, Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  Activity, BrainCircuit, Target, Zap, LayoutGrid, Sparkles, Globe,
  TrendingUp, TrendingDown
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@kit/ui/card';
import { EmptyState, EmptyStateHeading, EmptyStateText } from '@kit/ui/empty-state';

import { Skeleton } from '@kit/ui/skeleton';
import { cn } from '@kit/ui/utils';

// ============ HORIZON UI DESIGN TOKENS ============
const HORIZON = {
  primary: '#4318FF',
  primaryLight: '#4318FF15',
  primaryDark: '#3311CC',
  secondary: '#A3AED0',
  secondaryLight: '#A3AED015',
  success: '#01B574',
  successLight: '#01B57415',
  warning: '#FFB547',
  warningLight: '#FFB54715',
  error: '#EE5D50',
  errorLight: '#EE5D5015',
  info: '#2B77E5',
  infoLight: '#2B77E515',
  textPrimary: '#1B2559',
  textSecondary: '#A3AED0',
  textMuted: '#8F9BBA',
  background: '#F4F7FE',
  cardBg: '#FFFFFF',
  you: '#4318FF',
  shadow: '0 18px 40px rgba(112, 144, 176, 0.12)',
  shadowHover: '0 25px 50px rgba(112, 144, 176, 0.18)',
  shadowSm: '0 4px 12px rgba(112, 144, 176, 0.1)',
};

// ============ HORIZON CARD COMPONENT ============
interface HorizonCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
  style?: React.CSSProperties;
}

const HorizonCard = ({ children, className, title, subtitle, action, noPadding, style }: HorizonCardProps) => (
  <Card
    className={cn(
      "border-none bg-white rounded-[20px] overflow-hidden transition-all duration-300",
      className
    )}
    style={{ boxShadow: HORIZON.shadow, ...style }}
  >
    {(title || subtitle || action) && (
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div>
          {title && (
            <h3 className="text-lg font-bold" style={{ color: HORIZON.textPrimary }}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm mt-0.5" style={{ color: HORIZON.textSecondary }}>
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </CardHeader>
    )}
    <CardContent className={cn(noPadding ? "p-0" : "p-6", (title || subtitle) && !noPadding && "pt-2")}>
      {children}
    </CardContent>
  </Card>
);

// ============ KPI CARD COMPONENT ============
interface KpiCardProps {
  label: string;
  value: string;
  benchmark: string;
  trend: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const KpiCard = ({ label, value, benchmark, trend, icon: Icon, iconBg, iconColor }: KpiCardProps) => {
  const isPositive = trend.startsWith('+');

  return (
    <HorizonCard className="group hover:-translate-y-1 transition-all duration-300"
      style={{ boxShadow: HORIZON.shadowSm }}>
      <div className="flex items-center justify-between mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="w-6 h-6" style={{ color: iconColor }} />
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
          isPositive ? "bg-[#01B57415] text-[#01B574]" : "bg-[#EE5D5015] text-[#EE5D50]"
        )}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend}
        </div>
      </div>
      <div className="text-sm font-medium mb-1" style={{ color: HORIZON.textSecondary }}>
        {label}
      </div>
      <div className="text-lg font-bold" style={{ color: HORIZON.textPrimary }}>
        <span>{value}</span>
        <span className="text-sm font-medium mx-1" style={{ color: HORIZON.textSecondary }}>vs</span>
        <span style={{ color: HORIZON.textSecondary }}>{benchmark}</span>
      </div>
    </HorizonCard>
  );
};

export interface DashboardData {
  clinicName?: string;
  metrics: {
    clinicAiScore: { value: number; trend: number };
    serviceVisibility: { value: number; trend: number };
    avgPosition: { value: number; trend: number };
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
      <div
        className="p-3 rounded-[12px]"
        style={{
          backgroundColor: 'white',
          boxShadow: HORIZON.shadow,
          color: HORIZON.textPrimary
        }}
      >
        <p className="text-sm font-semibold mb-2">
          {data.name}
          {data.isCurrent && (
            <span
              className="ml-2 text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: HORIZON.successLight, color: HORIZON.success }}
            >
              Ваша Клініка
            </span>
          )}
        </p>
        <div className="space-y-1 text-xs">
          <p style={{ color: HORIZON.textSecondary }}>
            <span className="font-medium">Позиція:</span>{' '}
            <span style={{ color: HORIZON.textPrimary }}>{data.x.toFixed(1)}</span>
          </p>
          <p style={{ color: HORIZON.textSecondary }}>
            <span className="font-medium">Score:</span>{' '}
            <span style={{ color: HORIZON.textPrimary }}>{data.y.toFixed(1)}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function DashboardView({ data, loading = false }: DashboardViewProps) {
  const { metrics, trend, competitors } = data;

  if (loading) {
    return (
      <div className="space-y-6 pb-20" style={{ backgroundColor: HORIZON.background, margin: '0 -2rem -2rem -2rem', padding: '2rem', paddingTop: '2rem', minHeight: '100vh' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-32 rounded-[20px]" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px] rounded-[20px]" />
          <Skeleton className="h-[400px] rounded-[20px]" />
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <EmptyState
          className="rounded-[20px] p-16 animate-in zoom-in-95 duration-1000"
          style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
        >
          <EmptyStateHeading className="text-lg font-bold" style={{ color: HORIZON.textPrimary }}>
            Завантаження
          </EmptyStateHeading>
          <EmptyStateText className="text-sm mt-2" style={{ color: HORIZON.textSecondary }}>
            Виконуємо глибокий AI аналіз ваших даних
          </EmptyStateText>
        </EmptyState>
      </div>
    );
  }

  const kpis = [
    {
      label: 'ClinicAI Score',
      value: `${(metrics.clinicAiScore?.value || 0).toFixed(0)}%`,
      benchmark: '70%',
      trend: metrics.clinicAiScore?.trend >= 0 ? `+${metrics.clinicAiScore?.trend.toFixed(0)}%` : `${metrics.clinicAiScore?.trend.toFixed(0)}%`,
      icon: BrainCircuit,
      iconBg: HORIZON.primaryLight,
      iconColor: HORIZON.primary,
    },
    {
      label: 'Показник видимості',
      value: `${(metrics.serviceVisibility?.value || 0).toFixed(0)}%`,
      benchmark: '74%',
      trend: metrics.serviceVisibility?.trend >= 0 ? `+${metrics.serviceVisibility?.trend.toFixed(0)}%` : `${metrics.serviceVisibility?.trend.toFixed(0)}%`,
      icon: Target,
      iconBg: HORIZON.successLight,
      iconColor: HORIZON.success,
    },
    {
      label: 'Середня позиція',
      value: `${(metrics.avgPosition?.value || 0).toFixed(1)}/10`,
      benchmark: '7/10',
      trend: metrics.avgPosition?.trend >= 0 ? `+${metrics.avgPosition?.trend.toFixed(1)}` : `${metrics.avgPosition?.trend.toFixed(1)}`,
      icon: Activity,
      iconBg: HORIZON.errorLight,
      iconColor: HORIZON.error,
    },
    {
      label: 'Технічна оптимізація',
      value: `${(metrics.techOptimization?.value || 0).toFixed(0)}%`,
      benchmark: '75%',
      trend: metrics.techOptimization?.trend >= 0 ? `+${metrics.techOptimization?.trend.toFixed(0)}%` : `${metrics.techOptimization?.trend.toFixed(0)}%`,
      icon: Zap,
      iconBg: HORIZON.infoLight,
      iconColor: HORIZON.info,
    },
    {
      label: 'Оптимізація контенту',
      value: `${(metrics.contentOptimization?.value || 0).toFixed(0)}%`,
      benchmark: '70%',
      trend: metrics.contentOptimization?.trend >= 0 ? `+${metrics.contentOptimization?.trend.toFixed(0)}%` : `${metrics.contentOptimization?.trend.toFixed(0)}%`,
      icon: LayoutGrid,
      iconBg: HORIZON.primaryLight,
      iconColor: '#7551FF',
    },
    {
      label: 'E-E-A-T сигнали',
      value: `${(metrics.eeatSignal?.value || 0).toFixed(0)}%`,
      benchmark: '75%',
      trend: metrics.eeatSignal?.trend >= 0 ? `+${metrics.eeatSignal?.trend.toFixed(0)}%` : `${metrics.eeatSignal?.trend.toFixed(0)}%`,
      icon: Sparkles,
      iconBg: HORIZON.warningLight,
      iconColor: HORIZON.warning,
    },
    {
      label: 'Локальні показники',
      value: `${(metrics.localSignal?.value || 0).toFixed(0)}%`,
      benchmark: '74%',
      trend: metrics.localSignal?.trend >= 0 ? `+${metrics.localSignal?.trend.toFixed(0)}%` : `${metrics.localSignal?.trend.toFixed(0)}%`,
      icon: Globe,
      iconBg: HORIZON.successLight,
      iconColor: '#01B574',
    },
  ];

  return (
    <div className="space-y-6 pb-20" style={{ backgroundColor: HORIZON.background, margin: '0 -2rem -2rem -2rem', padding: '2rem', paddingTop: '2rem', minHeight: '100vh' }}>

      {/* ========== HEADER ========== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: HORIZON.textPrimary }}>
            Загальний огляд
          </h1>
          <p className="text-sm mt-1" style={{ color: HORIZON.textSecondary }}>
            Основні показники ефективності та динаміка розвитку {data.clinicName || 'вашої клініки'}
          </p>
        </div>
      </div>

      {/* ========== KPI CARDS ========== */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2 ml-1">
          <Target className="w-5 h-5" style={{ color: HORIZON.primary }} />
          <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: HORIZON.textPrimary }}>Ключові показники</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {kpis.map((kpi, i) => (
            <KpiCard key={i} {...kpi} />
          ))}
        </div>
      </section>

      {/* ========== CHARTS ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <HorizonCard title="Динаміка ClinicAI Score" subtitle="Історія змін за останні місяці">
          {trend.length === 0 ? (
            <EmptyState className="h-48 opacity-20">
              <EmptyStateHeading className="text-xs font-bold uppercase tracking-wider" style={{ color: HORIZON.textSecondary }}>
                Збір даних...
              </EmptyStateHeading>
            </EmptyState>
          ) : (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScoreDash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={HORIZON.primary} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={HORIZON.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={`${HORIZON.secondary}15`} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: HORIZON.textSecondary }}
                    tickFormatter={(value: string) => {
                      const date = new Date(value);
                      const months = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];
                      return months[date.getMonth()] || '';
                    }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: HORIZON.textSecondary }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: HORIZON.shadow,
                      padding: '12px',
                    }}
                    labelFormatter={(value: string) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('uk-UA', { month: 'long', day: 'numeric', year: 'numeric' });
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke={HORIZON.primary}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorScoreDash)"
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 3, stroke: 'white', fill: HORIZON.primary }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </HorizonCard>

        {/* Competitor Quadrant Chart */}
        <HorizonCard title="Конкурентний аналіз" subtitle="ClinicAI Score vs. Середня позиція">
          {competitors.length <= 1 ? (
            <EmptyState className="h-48 opacity-20">
              <EmptyStateHeading className="text-xs font-bold uppercase tracking-wider" style={{ color: HORIZON.textSecondary }}>
                Немає даних про конкурентів
              </EmptyStateHeading>
            </EmptyState>
          ) : (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 40, bottom: 20, left: 0 }}>
                  <CartesianGrid vertical={false} stroke={`${HORIZON.secondary}15`} />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name="Позиція"
                    domain={[10, 1]}
                    reversed
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: HORIZON.textSecondary }}
                    label={{ value: 'Середня позиція', position: 'insideBottom', offset: -10, fontSize: 10, fontWeight: 700, fill: HORIZON.textSecondary }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name="Score"
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 600, fill: HORIZON.textSecondary }}
                    label={{ value: 'AIV score', angle: -90, position: 'insideLeft', offset: 15, fontSize: 10, fontWeight: 700, fill: HORIZON.textSecondary }}
                  />
                  <ZAxis dataKey="z" range={[80, 200]} />
                  {/* Calculate median values for quadrant division */}
                  {(() => {
                    const aivScores = [...competitors.map(c => c.y)].sort((a, b) => a - b);
                    const positions = [...competitors.map(c => c.x)].sort((a, b) => a - b);
                    const medianAiv = aivScores.length > 0 ? aivScores[Math.floor(aivScores.length / 2)] ?? 50 : 50;
                    const medianPosition = positions.length > 0 ? positions[Math.floor(positions.length / 2)] ?? 5 : 5;
                    
                    const quadrantColors: Record<string, string> = {
                      leaders: HORIZON.success,
                      potential: HORIZON.warning,
                      unstable: HORIZON.info,
                      lagging: HORIZON.error,
                    };

                    const getQuadrant = (x: number, y: number): string => {
                      if (y >= medianAiv && x <= medianPosition) return 'leaders';
                      if (y >= medianAiv && x > medianPosition) return 'potential';
                      if (y < medianAiv && x <= medianPosition) return 'unstable';
                      return 'lagging';
                    };

                    return (
                      <>
                        {/* Quadrant dividers */}
                        <ReferenceLine x={medianPosition} stroke={HORIZON.secondary} strokeDasharray="3 3" strokeWidth={1} />
                        <ReferenceLine y={medianAiv} stroke={HORIZON.secondary} strokeDasharray="3 3" strokeWidth={1} />
                        {/* Quadrant labels */}
                        <text x="5%" y="15%" fontSize="10" fontWeight="700" fill={HORIZON.success} opacity={0.6}>
                          Лідери
                        </text>
                        <text x="55%" y="15%" fontSize="10" fontWeight="700" fill={HORIZON.warning} opacity={0.6}>
                          Потенціал
                        </text>
                        <text x="5%" y="85%" fontSize="10" fontWeight="700" fill={HORIZON.info} opacity={0.6}>
                          Нестабільні
                        </text>
                        <text x="55%" y="85%" fontSize="10" fontWeight="700" fill={HORIZON.error} opacity={0.6}>
                          Відсталі
                        </text>
                        <Tooltip content={<CompetitorScatterTooltip />} />
                        <Scatter name="Competitors" data={competitors}>
                          {competitors.map((entry, index) => {
                            const quadrant = getQuadrant(entry.x, entry.y);
                            const fillColor = entry.isCurrent ? HORIZON.you : quadrantColors[quadrant];
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={fillColor}
                                className="transition-all duration-300 hover:scale-125 cursor-pointer"
                                opacity={entry.isCurrent ? 1 : 0.7}
                              />
                            );
                          })}
                          <LabelList
                            dataKey="name"
                            position="bottom"
                            offset={12}
                            content={(props) => {
                              const { x, y, value, payload } = props as { x?: string | number; y?: string | number; value?: string | number; payload?: { isCurrent?: boolean } };
                              const xNum = typeof x === 'number' ? x : 0;
                              const yNum = typeof y === 'number' ? y : 0;
                              const displayName = payload?.isCurrent ? 'Ви' : (typeof value === 'string' ? value.split(' ')[0] : value);
                              return (
                                <text
                                  x={xNum}
                                  y={yNum + 12}
                                  fontSize="9"
                                  fontWeight="700"
                                  fill={payload?.isCurrent ? HORIZON.primary : HORIZON.textSecondary}
                                  textAnchor="middle"
                                >
                                  {displayName}
                                </text>
                              );
                            }}
                          />
                        </Scatter>
                      </>
                    );
                  })()}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </HorizonCard>

      </div>
    </div>
  );
}


