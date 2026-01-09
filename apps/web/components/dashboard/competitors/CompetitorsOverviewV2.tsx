'use client';

import React, { useState, useMemo } from 'react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ScatterChart, Scatter, ZAxis, Cell, LineChart, Line, BarChart, Bar,
    ReferenceLine, AreaChart, Area, LabelList, ComposedChart,
} from 'recharts';
import {
    Target, Zap, Activity, BrainCircuit,
    LayoutGrid,
    Sparkles, Globe, ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select';
import { cn } from '@kit/ui/utils';

// --- Premium 2026 Light Tokens ---
const TOKENS = {
    colors: {
        you: '#f43f5e', // Ruby
        c1: '#3b82f6', // Blue
        c2: '#8b5cf6', // Violet
        c3: '#10b981', // Emerald
        c4: '#f59e0b', // Amber
        c5: '#0ea5e9', // Sky
        c6: '#6366f1', // Indigo
        c7: '#d946ef', // Fuchsia
        c8: '#f97316', // Orange
        c9: '#14b8a6', // Teal
        c10: '#64748b', // Slate
        marketAvg: '#cbd5e1',
    },
    shadows: {
        soft: 'shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
        deep: 'shadow-[0_20px_50px_rgba(0,0,0,0.06)]',
    }
};

// --- Custom Modern Components ---

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

const BentoCard = ({ children, className, title, subtitle }: BentoCardProps) => (
    <Card className={cn(
        "border-none bg-white/70 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(15,23,42,0.04)] overflow-hidden transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] group",
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

interface GlassTooltipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}

const GlassTooltip = ({ active, payload, label }: GlassTooltipProps) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/95 backdrop-blur-xl border border-slate-100 p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-in fade-in zoom-in-95">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2">{label}</p>
                <div className="space-y-2">
                    {payload.map((entry, i) => (
                        <div key={i} className="flex items-center justify-between gap-8">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-xs font-bold text-slate-700">{entry.name === 'you' ? 'Ви' : entry.name}</span>
                            </div>
                            <span className="text-xs font-black text-slate-900">{(entry.value || 0).toFixed(2)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export function CompetitorsOverview() {
    const [selectedService, setSelectedService] = useState('gynecology');

    // --- Fixed Stable Mock Data ---
    const services = useMemo(() => [
        "УЗД Сердця", "УЗД Голови", "Консультація дерматолога",
        "Консультація хірурга", "Консультація ЛОР", "Мамографія",
        "УЗД Черевної порожнини", "Консультація офтальмолога"
    ], []);

    const competitors = useMemo(() => [
        { id: 'c1', name: 'Кл. Чудайкіна', color: TOKENS.colors.c1, url: 'chudaikina.com' },
        { id: 'c2', name: 'Sobco Clinic', color: TOKENS.colors.c2, url: 'sobco.ua' },
        { id: 'c3', name: 'Planeta Zdorovya', color: TOKENS.colors.c3, url: 'planeta.dp.ua' },
        { id: 'c4', name: 'Dopelclinic', color: TOKENS.colors.c4, url: 'dopel.dp.ua' },
        { id: 'c5', name: 'Oxford Med', color: TOKENS.colors.c5, url: 'oxford-med.ua' },
        { id: 'c6', name: 'JMC Center', color: TOKENS.colors.c6, url: 'jmc.org.ua' },
        { id: 'c7', name: 'Garvis Med', color: TOKENS.colors.c7, url: 'garvis.com.ua' },
        { id: 'c8', name: 'Medical Star', color: TOKENS.colors.c8, url: 'medstar.ua' },
        { id: 'c9', name: 'Daily Med', color: TOKENS.colors.c9, url: 'dailymed.dp.ua' },
        { id: 'c10', name: 'Zdorovya Plus', color: TOKENS.colors.c10, url: 'zdorovya.ua' },
    ], []);

    const kpis = useMemo(() => [
        { label: 'Clinic AI Score', value: '72.8', trend: '+12.5%', icon: BrainCircuit, color: 'text-indigo-500' },
        { label: 'Видимість послуг', value: '51.4%', trend: '+4.2%', icon: Target, color: 'text-emerald-500' },
        { label: 'Середня позиція', value: '4.2', trend: '-0.5', icon: Activity, color: 'text-rose-500' },
        { label: 'Технічна оптимізація', value: '94.2%', trend: '+1.2%', icon: Zap, color: 'text-blue-500' },
        { label: 'Оптимізація контенту', value: '88.5%', trend: '+3.4%', icon: LayoutGrid, color: 'text-violet-500' },
        { label: 'E-E-A-T сигнали', value: '92.0', trend: '+2.1%', icon: Sparkles, color: 'text-amber-500' },
        { label: 'Локальні показники', value: '85.6', trend: '+0.8%', icon: Globe, color: 'text-teal-500' },
    ], []);

    const mapData = useMemo(() => [
        { x: 3.2, y: 72.8, name: 'you', isCurrent: true, color: TOKENS.colors.you, url: 'your-clinic.ua' },
        ...competitors.map((c, i) => ({
            x: [2.1, 4.2, 1.5, 6.5, 8.2, 3.8, 5.5, 7.1, 1.8, 4.9][i],
            y: [75, 51, 88, 30, 15, 62, 45, 20, 92, 55][i],
            name: c.name,
            isCurrent: false,
            color: c.color,
            url: c.url
        }))
    ], [competitors]);

    interface DynamicsRow {
      p: string;
      you: number;
      market: number;
      [key: string]: string | number; // For dynamic competitor IDs
    }

    const dynamics = useMemo(() => {
        const months = ['бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер'];
        return months.map((m, mi) => {
            const row: DynamicsRow = { p: m, you: 0, market: 0 };
            row.you = 60 + Math.sin(mi) * 10 + (selectedService === 'gynecology' ? 5 : 0);
            competitors.forEach((c, ci) => {
                row[c.id] = 50 + Math.cos(mi + ci) * 15;
            });
            row.market = 55 + Math.sin(mi * 0.5) * 5;
            return row;
        });
    }, [selectedService, competitors]);

    const gapData = useMemo(() => services.map((s, i) => ({
        service: s,
        diff: [22, -15, 10, -25, 18, -12][i % 6]
    })), [services]);

    interface DistributionRow {
      service: string;
      you: number;
      c1: number;
      c2: number;
    }

    const distributionData = useMemo(() => services.map((s, i) => {
        const row: DistributionRow = { service: s, you: 0, c1: 0, c2: 0 };
        row.you = [45, 52, 68, 35, 72, 58, 44, 61][i % 8] ?? 0;
        row.c1 = [60, 48, 75, 42, 65, 50, 55, 48][i % 8] ?? 0;
        row.c2 = [30, 85, 40, 92, 25, 70, 68, 35][i % 8] ?? 0;
        return row;
    }), [services]);

    const signals = useMemo(() => [
        ...competitors.slice(0, 10).map(c => ({ name: c.name, v: 50 + Math.random() * 40, f: '#f1f5f9' })),
        { name: 'Ви', v: 90, f: TOKENS.colors.you },
    ], [competitors]);

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-700">

            {/* 1. Market Pulse Headers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                {kpis.map((kpi, i) => (
                    <BentoCard key={i} className="group cursor-default overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                            <kpi.icon className="w-24 h-24" />
                        </div>
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("p-2 rounded-2xl bg-white shadow-sm border border-slate-50", kpi.color)}>
                                <kpi.icon className="w-5 h-5" />
                            </div>
                            <Badge className="bg-slate-100 text-slate-600 border-none font-black text-[10px] px-2 py-0.5 h-5">
                                {kpi.trend}
                            </Badge>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-1">{kpi.label}</p>
                        <h3 className="text-3xl font-black italic tracking-tighter text-slate-900">{kpi.value}</h3>
                    </BentoCard>
                ))}
            </div>

            {/* 2. Main Analytics Suite */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Market Landscape Map (8 col) */}
                <BentoCard className="lg:col-span-8" title="Матриця: ClinicAI Score vs. Середня Позиція" subtitle="Глобальний аудит конкурентного позиціонування">
                    <div className="h-[450px] relative">
                        {/* Quadrant Labels */}
                        <div className="absolute inset-0 flex pointer-events-none opacity-[0.03]">
                            <div className="flex-1 flex flex-col items-center justify-center border-r border-b border-slate-900 border-dashed"><span className="text-4xl font-black uppercase italic">Legacy</span></div>
                            <div className="flex-1 flex flex-col items-center justify-center border-b border-slate-900 border-dashed"><span className="text-4xl font-black uppercase italic">Challenger</span></div>
                        </div>
                        <div className="absolute inset-0 flex pointer-events-none opacity-[0.03] mt-[225px]">
                            <div className="flex-1 flex flex-col items-center justify-center border-r border-slate-900 border-dashed"><span className="text-4xl font-black uppercase italic">Niche</span></div>
                            <div className="flex-1 flex flex-col items-center justify-center"><span className="text-4xl font-black uppercase italic">Dominant</span></div>
                        </div>

                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis
                                    type="number" dataKey="x" name="Position" domain={[10, 1]}
                                    axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                                />
                                <YAxis
                                    type="number" dataKey="y" name="Score" domain={[0, 100]}
                                    axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }}
                                />
                                <ZAxis range={[150, 700]} />
                                <Tooltip content={<GlassTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }} />
                                <Scatter name="Clinics" data={mapData}>
                                    {mapData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.isCurrent ? TOKENS.colors.you : TOKENS.colors.marketAvg}
                                            className="cursor-pointer transition-all duration-500 hover:scale-[1.4]"
                                            stroke={entry.isCurrent ? 'white' : 'transparent'}
                                            strokeWidth={3}
                                        />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </BentoCard>

                {/* Leaders Table (4 col) */}
                <BentoCard className="lg:col-span-4" title="ТОП-10 конкурентів" subtitle="Реєстр лідерів ринку">
                    <div className="space-y-2 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
                        {mapData.sort((a, b) => (b.y || 0) - (a.y || 0)).map((l, i) => (
                            <div key={i} className={cn(
                                "flex items-center justify-between p-3 rounded-2xl border transition-all cursor-default group/item",
                                l.isCurrent ? "bg-rose-50 border-rose-100" : "bg-slate-50/50 border-slate-100 hover:bg-white"
                            )}>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-slate-400">{(i + 1).toString().padStart(2, '0')}</span>
                                    <div>
                                        <p className={cn("text-xs font-bold leading-none", l.isCurrent ? "text-rose-600" : "text-slate-700")}>
                                            {l.isCurrent ? 'Ваша Клініка' : l.name}
                                        </p>
                                        <p className="text-[9px] font-medium text-slate-400 mt-1 uppercase tracking-tighter">{l.url}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-slate-900">{(l.y || 0).toFixed(2)}%</p>
                                    <p className="text-[9px] font-bold text-emerald-500">+{(2.4 - i * 0.2).toFixed(2)}%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </BentoCard>
            </div>

            {/* 3. Dynamics Suite */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Growth Dynamics */}
                <BentoCard title="Динаміка ClinicAI Score" subtitle="Щомісячна швидкість зміни показників">
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dynamics}>
                                <defs>
                                    <linearGradient id="glowRed" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={TOKENS.colors.you} stopOpacity={0.15} />
                                        <stop offset="95%" stopColor={TOKENS.colors.you} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" />
                                <XAxis dataKey="p" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#64748b' }} />
                                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#64748b' }} />
                                <Tooltip content={<GlassTooltip />} />
                                {competitors.slice(0, 3).map((c) => (
                                    <Area key={c.id} type="monotone" dataKey={c.id} stroke={c.color} strokeWidth={1} fill="transparent" name={c.name} opacity={0.3} />
                                ))}
                                <Area type="monotone" dataKey="market" stroke="#cbd5e1" strokeWidth={2} fill="transparent" strokeDasharray="5 5" name="Market Avg" />
                                <Area type="monotone" dataKey="you" name="you" stroke={TOKENS.colors.you} strokeWidth={4} fillOpacity={1} fill="url(#glowRed)" className="drop-shadow-lg" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </BentoCard>

                {/* Sector Intensity (Interactive) */}
                <BentoCard className="relative overflow-visible" title="Конкурентна динаміка AIV по послугам" subtitle="Порівняння за напрямками">
                    <div className="absolute top-4 right-6 z-10 w-48">
                        <Select value={selectedService} onValueChange={setSelectedService}>
                            <SelectTrigger className="h-9 px-4 rounded-xl bg-slate-100 border-none font-black italic text-xs shadow-inner">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100">
                                <SelectItem value="gynecology" className="text-xs font-bold">Gynaecology Core</SelectItem>
                                <SelectItem value="ultrasound" className="text-xs font-bold">Heart Ultrasound</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="h-[350px] mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dynamics}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(0,0,0,0.03)" />
                                <XAxis dataKey="p" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#64748b' }} />
                                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#64748b' }} />
                                <Tooltip content={<GlassTooltip />} />
                                {competitors.slice(0, 5).map((c) => (
                                    <Line key={c.id} type="monotone" dataKey={c.id} stroke={c.color} strokeWidth={1} dot={false} opacity={0.2} name={c.name} />
                                ))}
                                <Line type="stepAfter" dataKey="market" stroke="#e2e8f0" strokeWidth={2} dot={false} strokeDasharray="6 6" name="Benchmark" />
                                <Line type="monotone" dataKey="you" name="you" stroke={TOKENS.colors.you} strokeWidth={5} dot={false} className="drop-shadow-sm" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </BentoCard>
            </div>

            {/* 4. Diagnostic Suite */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Service Distribution */}
                <BentoCard title="Розподіл AIV score по Послугам" subtitle="Щільність показників за юнітами">
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={distributionData} margin={{ left: 60, right: 60 }} barGap={3}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="service" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#475569' }} width={120} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.01)' }} />
                                <Bar dataKey="you" fill={TOKENS.colors.you} barSize={8} radius={[0, 10, 10, 0]} name="Ви">
                                    <LabelList dataKey="you" position="right" style={{ fontSize: '9px', fontWeight: 900, fill: TOKENS.colors.you }} formatter={(v: number) => `Ви ${Number(v).toFixed(2)}%`} />
                                </Bar>
                                <Bar dataKey="c1" fill="#e2e8f0" barSize={8} radius={[0, 10, 10, 0]} name="Competitor A" />
                                <Bar dataKey="c2" fill="#f1f5f9" barSize={8} radius={[0, 10, 10, 0]} name="Competitor B" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </BentoCard>

                {/* Gap Analysis */}
                <BentoCard title="Gap аналіз по послугам" subtitle="Стратегічна розбіжність за напрямками">
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart layout="vertical" data={gapData} margin={{ left: 100, right: 80 }}>
                                <CartesianGrid horizontal={false} stroke="rgba(0,0,0,0.03)" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="service" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#475569' }} width={120} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.01)' }} />
                                <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={2} />
                                <Bar dataKey="diff" barSize={14} radius={[10, 10, 10, 10]}>
                                    <LabelList dataKey="diff" position="right" style={{ fontSize: '10px', fontWeight: 900, fill: '#0f172a' }} formatter={(v: number) => v > 0 ? `+${v.toFixed(2)}%` : `${v.toFixed(2)}%`} />
                                    {gapData.map((entry, index) => (
                                        <Cell key={index} fill={(entry.diff || 0) < 0 ? TOKENS.colors.you : '#10b981'} fillOpacity={0.8} />
                                    ))}
                                </Bar>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </BentoCard>
            </div>

            {/* 5. Signal Audit Grid (Image 2) */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2 ml-1">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-900 leading-none">Аналіз конкурентних сигналів</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                        { t: "ClinicAI score vs ТОП-10", i: BrainCircuit },
                        { t: "Видимість послуг vs ТОП-10", i: Target },
                        { t: "Середня позиція vs ТОП-10", i: Activity },
                        { t: "Конкуренція по E-E-A-T", i: Sparkles },
                        { t: "Конкуренція по Тех. оптимізації", i: Zap },
                        { t: "Конкуренція по Контенту", i: LayoutGrid },
                        { t: "Локальні показники vs ТОП-10", i: Globe }
                    ].map((m, i) => (
                        <BentoCard key={i} className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none">{m.t}</p>
                                <div className="p-1.5 rounded-lg bg-slate-50">
                                    <m.i className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                            </div>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={signals} margin={{ bottom: 30 }}>
                                        <XAxis
                                            dataKey="name"
                                            hide={false}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 7, fontWeight: 800, fill: '#64748b' }}
                                            angle={-45}
                                            textAnchor="end"
                                            interval={0}
                                        />
                                        <Bar dataKey="v" radius={[3, 3, 0, 0]} barSize={16}>
                                            {signals.map((s, idx) => {
                                                const comp = idx < 10 ? competitors[idx] : null;
                                                return (
                                                    <Cell
                                                        key={idx}
                                                        fill={idx === 10 ? TOKENS.colors.you : (comp?.color || '#cbd5e1')}
                                                    />
                                                );
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-between items-end mt-6 pt-4 border-t border-slate-50">
                                <span className="text-[11px] font-black italic text-slate-900">Rank</span>
                                <span className="text-base font-black italic text-rose-500">#{i + 4}</span>
                            </div>
                        </BentoCard>
                    ))}
                </div>
            </section>

            {/* 6. Strategic Executive Insights (Bonus) */}
            <div className="relative group pt-4">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-rose-500/10 to-transparent blur-[60px] opacity-60 rounded-[4rem]" />
                <BentoCard className="border-2 border-white relative z-10 overflow-hidden bg-white/60">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 p-4">
                        <div className="space-y-10">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-[40%] bg-slate-900 flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.06)] animate-pulse">
                                    <Zap className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black italic tracking-tighter uppercase text-slate-900 leading-[0.8]">AI Command</h2>
                                    <p className="text-[11px] font-black tracking-[0.5em] uppercase text-slate-600 mt-2">Executive Strategy Engine</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {[
                                    { label: "Critical Window", text: "Competitor B is losing signal authority in 'Heart' sector. Capture gap within 14 days." },
                                    { label: "Protocol Update", text: "Mobile E-E-A-T signals require immediate boost via professional bio updates." }
                                ].map((insight, idx) => (
                                    <div key={idx} className="flex gap-5 p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm transition-all hover:scale-[1.01] hover:shadow-[0_20px_50px_rgba(0,0,0,0.06)]">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 mt-2" />
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-rose-500 mb-1">{insight.label}</p>
                                            <p className="text-sm font-bold text-slate-700 leading-relaxed">{insight.text}</p>
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-slate-300 ml-auto" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative flex flex-col justify-center items-center text-center p-12 bg-slate-950 rounded-[3.5rem] text-white shadow-[0_20px_50px_rgba(0,0,0,0.06)] overflow-hidden">
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,_#818cf8_0%,_transparent_50%)]" />
                                <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,_#f43f5e_0%,_transparent_50%)]" />
                            </div>
                            <h4 className="text-2xl font-black italic mb-6 uppercase tracking-tighter italic z-10">Generate Roadmap</h4>
                            <p className="text-sm text-slate-600 font-medium max-w-xs mb-10 leading-relaxed z-10">
                                Deploy the Alpha-Strategic plan to achieve 1.5 position in &apos;Diagnostic&apos; cluster.
                            </p>
                            <button className="relative group/btn z-10 px-12 py-5 rounded-full bg-white text-slate-950 text-xs font-black uppercase tracking-widest shadow-white/10 shadow-2xl overflow-hidden transition-all hover:scale-105 active:scale-95">
                                <span className="relative z-10">Initiate Protocol</span>
                                <div className="absolute inset-0 bg-slate-100 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                            </button>
                        </div>
                    </div>
                </BentoCard>
            </div>

        </div>
    );
}
