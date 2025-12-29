'use client';

import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell, LabelList
} from 'recharts';
import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { EmptyState, EmptyStateHeading, EmptyStateText } from '@kit/ui/empty-state';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@kit/ui/chart';
import { Skeleton } from '@kit/ui/skeleton';

import { cn } from '@kit/ui/utils';


// --- Horizon UI Design Tokens ---
const HORIZON = {
  primary: '#4318FF',
  primaryLight: '#4318FF15',
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
  background: '#F4F7FE',
  textPrimary: '#1B2559',
  textSecondary: '#A3AED0',
  shadow: '0 18px 40px rgba(112, 144, 176, 0.12)',
  shadowHover: '0 25px 50px rgba(112, 144, 176, 0.18)',
  shadowSm: '0 4px 12px rgba(112, 144, 176, 0.1)',
  // Chart colors
  colors: {
    c1: '#6AD2FF',
    c2: '#4318FF',
    c3: '#01B574',
    c4: '#FFB547',
    c5: '#EE5D50',
    c6: '#7551FF',
  }
};



export interface DashboardData {
  clinicName?: string;
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
              Your Clinic
            </span>
          )}
          {!data.isCurrent && data.x <= 3 && (
            <span
              className="ml-2 text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: HORIZON.warningLight, color: HORIZON.warning }}
            >
              Top Competitor
            </span>
          )}
        </p>
        <div className="space-y-1 text-xs">
          <p style={{ color: HORIZON.textSecondary }}>
            <span className="font-medium">Pos:</span>{' '}
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

  return (
    <div className="max-w-full mx-auto space-y-16 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000 min-h-screen px-4 md:px-12 py-16" style={{ backgroundColor: HORIZON.background }}>

      {/* ========== HEADER ========== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: HORIZON.textPrimary }}>
            Загальний огляд
          </h1>
          <p className="text-sm mt-1" style={{ color: HORIZON.textSecondary }}>
            Основні показники ефективності та динаміка розвитку клініки {data.clinicName || 'clinic.ua'}
          </p>
        </div>
      </div>

      {/* Group 1: High Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-16 border-b pb-12" style={{ borderColor: HORIZON.background }}>
        {/* Metric 1 */}
        <div className="group transition-all duration-300">
          <p className="text-[13px] font-bold uppercase tracking-wider mb-2" style={{ color: HORIZON.textSecondary }}>Середній Clinic AI Score</p>
          <div className="text-6xl font-black tracking-tighter py-2 transition-transform duration-300 group-hover:scale-[1.02]" style={{ color: HORIZON.textPrimary }}>
            {(metrics.clinicAiScore?.value || 0).toFixed(0)}%
          </div>
          <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold mt-2",
            metrics.clinicAiScore?.trend >= 0 ? "bg-[#01B57415] text-[#01B574]" : "bg-[#EE5D5015] text-[#EE5D50]"
          )}>
            {metrics.clinicAiScore?.trend >= 0 ? '+' : ''}{metrics.clinicAiScore?.trend.toFixed(0)}% <span className="opacity-70 font-medium">за 30 днів</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="group transition-all duration-300">
          <p className="text-[13px] font-bold uppercase tracking-wider mb-2" style={{ color: HORIZON.textSecondary }}>Видимість послуг</p>
          <div className="text-6xl font-black tracking-tighter py-2 transition-transform duration-300 group-hover:scale-[1.02]" style={{ color: HORIZON.textPrimary }}>
            {(metrics.serviceVisibility?.value || 0).toFixed(0)}%
          </div>
          <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold mt-2",
            metrics.serviceVisibility?.trend >= 0 ? "bg-[#01B57415] text-[#01B574]" : "bg-[#EE5D5015] text-[#EE5D50]"
          )}>
            {metrics.serviceVisibility?.trend >= 0 ? '+' : ''}{metrics.serviceVisibility?.trend.toFixed(0)}% <span className="opacity-70 font-medium">за 30 днів</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="group transition-all duration-300">
          <p className="text-[13px] font-bold uppercase tracking-wider mb-2" style={{ color: HORIZON.textSecondary }}>Середня позиція</p>
          <div className="text-6xl font-black tracking-tighter py-2 transition-transform duration-300 group-hover:scale-[1.02]" style={{ color: HORIZON.textPrimary }}>
            {(metrics.avgPosition?.value || 0).toFixed(1)}
          </div>
          <div className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-bold mt-2",
            metrics.avgPosition?.trend >= 0 ? "bg-[#01B57415] text-[#01B574]" : "bg-[#EE5D5015] text-[#EE5D50]"
          )}>
            {metrics.avgPosition?.trend >= 0 ? '+' : ''}{metrics.avgPosition?.trend.toFixed(1)} <span className="opacity-70 font-medium">за 30 днів</span>
          </div>
        </div>
      </div>

      {/* Group 2: Breakdown Signals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* Signal 1 */}
        <div className="group border-r border-[#F4F7FE] last:border-none pr-4">
          <p className="text-[12px] font-bold uppercase tracking-widest mb-1" style={{ color: HORIZON.textSecondary }}>Технічна оптимізація</p>
          <div className="text-4xl font-black tracking-tight py-1" style={{ color: HORIZON.textPrimary }}>
            {(metrics.techOptimization?.value || 0).toFixed(0)}%
          </div>
          <p className={cn("text-[11px] font-bold mt-1", metrics.techOptimization?.trend >= 0 ? "text-[#01B574]" : "text-[#EE5D50]")}>
            {metrics.techOptimization?.trend >= 0 ? '+' : ''}{metrics.techOptimization?.trend.toFixed(0)}% за 30 днів
          </p>
        </div>

        {/* Signal 2 */}
        <div className="group border-r border-[#F4F7FE] last:border-none pr-4">
          <p className="text-[12px] font-bold uppercase tracking-widest mb-1" style={{ color: HORIZON.textSecondary }}>Оптимізація контенту</p>
          <div className="text-4xl font-black tracking-tight py-1" style={{ color: HORIZON.textPrimary }}>
            {(metrics.contentOptimization?.value || 0).toFixed(0)}%
          </div>
          <p className={cn("text-[11px] font-bold mt-1", metrics.contentOptimization?.trend >= 0 ? "text-[#01B574]" : "text-[#EE5D50]")}>
            {metrics.contentOptimization?.trend >= 0 ? '+' : ''}{metrics.contentOptimization?.trend.toFixed(0)}% за 30 днів
          </p>
        </div>

        {/* Signal 3 */}
        <div className="group border-r border-[#F4F7FE] last:border-none pr-4">
          <p className="text-[12px] font-bold uppercase tracking-widest mb-1" style={{ color: HORIZON.textSecondary }}>E-E-A-T сигнали</p>
          <div className="text-4xl font-black tracking-tight py-1" style={{ color: HORIZON.textPrimary }}>
            {(metrics.eeatSignal?.value || 0).toFixed(1)}
          </div>
          <p className={cn("text-[11px] font-bold mt-1", metrics.eeatSignal?.trend >= 0 ? "text-[#01B574]" : "text-[#EE5D50]")}>
            {metrics.eeatSignal?.trend >= 0 ? '+' : ''}{metrics.eeatSignal?.trend.toFixed(1)} за 30 днів
          </p>
        </div>

        {/* Signal 4 */}
        <div className="group">
          <p className="text-[12px] font-bold uppercase tracking-widest mb-1" style={{ color: HORIZON.textSecondary }}>Локальні показники</p>
          <div className="text-4xl font-black tracking-tight py-1" style={{ color: HORIZON.textPrimary }}>
            {(metrics.localSignal?.value || 0).toFixed(1)}
          </div>
          <p className={cn("text-[11px] font-bold mt-1", metrics.localSignal?.trend >= 0 ? "text-[#01B574]" : "text-[#EE5D50]")}>
            {metrics.localSignal?.trend >= 0 ? '+' : ''}{metrics.localSignal?.trend.toFixed(1)} за 30 днів
          </p>
        </div>
      </div>

      <div className="space-y-12 mt-4">
        <Card
          className="border-none rounded-[20px] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group relative"
          style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
        >
          <CardHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-wider" style={{ color: HORIZON.textSecondary }}>
                  Динаміка ClinicAI Score
                </CardTitle>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: HORIZON.primaryLight }}
              >
                <Activity className="h-5 w-5" style={{ color: HORIZON.primary }} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-4">
            {trend.length === 0 ? (
              <EmptyState className="h-48 opacity-20">
                <EmptyStateHeading className="text-xs font-bold uppercase tracking-wider" style={{ color: HORIZON.textSecondary }}>
                  Збір даних...
                </EmptyStateHeading>
              </EmptyState>
            ) : (
              <ChartContainer
                config={{
                  score: { label: 'ClinicAI Score', color: HORIZON.primary },
                }}
                className="h-[400px] w-full mt-2"
              >
                <AreaChart data={trend} margin={{ top: 10, right: 20, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={HORIZON.primary} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={HORIZON.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={`${HORIZON.secondary}15`} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 600, fill: HORIZON.textSecondary }}
                    tickFormatter={(value: string) => {
                      const date = new Date(value);
                      const months = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
                      return months[date.getMonth()] || '';
                    }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fontWeight: 600, fill: HORIZON.textSecondary }}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="rounded-[12px] border-none"
                        style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
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
                    stroke={HORIZON.primary}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: 'white', fill: HORIZON.primary }}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card
          className="border-none rounded-[20px] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl relative group"
          style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
        >
          <CardHeader className="p-6 pb-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider" style={{ color: HORIZON.textSecondary }}>
              Конкурентний аналіз
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-4 relative min-h-[360px]">
            {/* Quadrant labels */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex flex-wrap p-8 pt-16">
              <div className="w-1/2 h-1/2 border-r border-b flex items-center justify-center" style={{ borderColor: HORIZON.secondary }}>
                <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: HORIZON.textSecondary }}>Legacy</span>
              </div>
              <div className="w-1/2 h-1/2 border-b flex items-center justify-center" style={{ borderColor: HORIZON.secondary }}>
                <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: HORIZON.textPrimary }}>Leading</span>
              </div>
              <div className="w-1/2 h-1/2 border-r flex items-center justify-center" style={{ borderColor: HORIZON.secondary }}>
                <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: HORIZON.textSecondary }}>Niche</span>
              </div>
              <div className="w-1/2 h-1/2 flex items-center justify-center">
                <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: HORIZON.textSecondary }}>Challengers</span>
              </div>
            </div>

            {competitors.length <= 1 ? (
              <EmptyState className="h-48 opacity-20">
                <EmptyStateHeading className="text-xs font-bold uppercase tracking-wider" style={{ color: HORIZON.textSecondary }}>
                  Немає лідерів
                </EmptyStateHeading>
              </EmptyState>
            ) : (
              <>
                <ChartContainer
                  config={{
                    current: { label: 'Ваша Клініка', color: '#4A5568' },
                    competitor: { label: 'Ринкове поле', color: HORIZON.primary },
                  }}
                  className="h-[500px] mt-6"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 60, bottom: 20, left: -25 }}>
                      <CartesianGrid vertical={false} stroke={`${HORIZON.secondary}15`} />
                      <XAxis
                        type="number"
                        dataKey="x"
                        name="Середня позиція"
                        unit=""
                        domain={[5, 1]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fontWeight: 600, fill: HORIZON.textSecondary }}
                        label={{ value: 'Середня позиція', position: 'insideBottomRight', offset: -10, fontSize: 10, fontWeight: 700, fill: HORIZON.textSecondary }}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        name="AIV score"
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fontWeight: 600, fill: HORIZON.textSecondary }}
                        label={{ value: 'AIV score', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fontWeight: 700, fill: HORIZON.textSecondary }}
                      />
                      <ZAxis dataKey="z" range={[100, 200]} />
                      <ChartTooltip content={<CompetitorScatterTooltip />} />
                      <Scatter name="Competitors" data={competitors}>
                        {competitors.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.isCurrent ? '#4A5568' : HORIZON.primary}
                            className="transition-all duration-500 hover:scale-[1.1] cursor-pointer"
                          />
                        ))}
                        <LabelList
                          dataKey="name"
                          position="bottom"
                          offset={10}
                          content={(props) => {
                            const { x, y, value, payload } = props as { x?: string | number; y?: string | number; value?: string | number; payload?: { isCurrent?: boolean } };
                            const xNum = typeof x === 'number' ? x : 0;
                            const yNum = typeof y === 'number' ? y : 0;
                            const name = value === 'Ваша Клініка' || payload?.isCurrent ? 'наша клініка' : value;
                            return (
                              <text x={xNum} y={yNum + 15} fontSize="9" fontWeight="700" fill={HORIZON.textSecondary} textAnchor="middle">
                                {name}
                              </text>
                            );
                          }}
                        />
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

