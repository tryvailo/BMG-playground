'use client';

import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import { ArrowUp, ArrowDown, Target, Share2, Zap, List, Settings, FileText, Shield, MapPin } from 'lucide-react';

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
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-lg">
        <p className="text-sm font-semibold text-slate-900 mb-2">
          {data.name}
          {data.isCurrent && (
            <span className="ml-2 text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">
              Your Clinic
            </span>
          )}
        </p>
        <div className="space-y-1 text-xs">
          <p className="text-slate-600">
            <span className="font-medium">Pos:</span>{' '}
            <span className="text-slate-900">{data.x.toFixed(1)}</span>
          </p>
          <p className="text-slate-600">
            <span className="font-medium">Score:</span>{' '}
            <span className="text-slate-900">{data.y.toFixed(1)}</span>
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
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600',
    green: 'bg-green-100 text-green-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    orange: 'bg-orange-100 text-orange-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  const isPositive = trend >= 0;
  const trendAbs = Math.abs(trend);
  const trendDisplay = trendAbs > 0 ? `${isPositive ? '+' : ''}${trend.toFixed(1)}` : '0.0';

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-2">{value}</h3>
        </div>
        <div className={`p-2 rounded-lg ${colors[color] || 'bg-slate-100 text-slate-600'}`}>
          <Icon size={20} />
        </div>
      </div>
      {trendAbs > 0 && (
        <div className="flex items-center mt-4 text-sm">
          {isPositive ? <ArrowUp size={16} className="text-green-500 mr-1" /> : <ArrowDown size={16} className="text-red-500 mr-1" />}
          <span className={isPositive ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>{trendDisplay}</span>
          <span className="text-slate-400 ml-2">vs last month</span>
        </div>
      )}
      {subtext && trendAbs === 0 && (
        <div className="mt-4 text-sm text-slate-400">
          {subtext}
        </div>
      )}
      {note && <p className="text-xs text-slate-400 mt-1">{note}</p>}
    </div>
  );
};

/**
 * Pure Dashboard View Component
 * 
 * This component displays KPI cards, trend chart, and competitor scatter plot.
 * It accepts a simple data structure and renders the UI without any data fetching logic.
 */
export function DashboardView({ data }: DashboardViewProps) {
  const { metrics, trend, competitors } = data;

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Завантаження даних...
      </div>
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
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">AIV Score History</h3>
          <div className="h-72">
            {trend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                <p>Not enough data for trend analysis</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b'}}
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
                    tick={{fill: '#64748b'}} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
                  <Area 
                    type={trend.length === 1 ? 'linear' : 'monotone'}
                    dataKey="score" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorScore)"
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Competitor Landscape Scatter Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Competitor Landscape</h3>
          <div className="h-72">
            {competitors.length <= 1 ? (
              <div className="h-full flex items-center justify-center text-slate-400">
                <p>No competitors found for comparison</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    type="number"
                    dataKey="x"
                    name="Avg Position"
                    domain={[10, 1]} // Inverted: 10 (left) -> 1 (right)
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#64748b'}}
                    label={{ 
                      value: 'Avg Position', 
                      position: 'insideBottom', 
                      offset: -5,
                      style: { textAnchor: 'middle', fill: '#64748b' }
                    }}
                  />
                  <YAxis 
                    type="number"
                    dataKey="y"
                    name="ClinicAI Score"
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{fill: '#64748b'}}
                    label={{ 
                      value: 'ClinicAI Score', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle', fill: '#64748b' }
                    }}
                  />
                  <ZAxis dataKey="z" range={[60, 400]} />
                  <Tooltip 
                    content={<CompetitorScatterTooltip />}
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Scatter name="Competitors" data={competitors} fill="#94a3b8">
                    {competitors.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isCurrent ? '#10b981' : '#94a3b8'}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
          {competitors.length > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span>Your Clinic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                <span>Competitors</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

