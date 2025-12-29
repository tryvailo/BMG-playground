'use client';

import React, { useState, useMemo } from 'react';
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ScatterChart, Scatter, ZAxis, Cell, LineChart, Line, BarChart, Bar,
    ReferenceLine, AreaChart, Area, LabelList, ComposedChart,
    type TooltipProps
} from 'recharts';
import {
    Target, Zap, Activity, BrainCircuit,
    LayoutGrid, Sparkles, Globe,
    TrendingUp, TrendingDown, MoreHorizontal,
    Search,
    Filter, Download, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kit/ui/select';
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
    c1: '#6AD2FF',
    c2: '#7551FF',
    c3: '#01B574',
    c4: '#FFB547',
    c5: '#EE5D50',
    c6: '#39B8FF',
    c7: '#FB8F76',
    c8: '#3DD598',
    c9: '#E9A0FF',
    c10: '#A3AED0',
    marketAvg: '#E9EDF7',
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

// ============ COMPETITOR ROW COMPONENT ============
interface CompetitorRowProps {
    rank: number;
    name: string;
    url: string;
    score: number;
    serviceScore: number;
    visibility: number;
    position: number;
    trend: number;
    color: string;
    isCurrent?: boolean;
    isSelected?: boolean;
    onClick?: () => void;
}

const CompetitorRow = ({ rank, name, url, score, serviceScore, visibility, position, trend, color, isCurrent, isSelected, onClick }: CompetitorRowProps) => (
    <div
        className={cn(
            "grid grid-cols-6 items-center px-8 py-4 rounded-[20px] transition-all duration-200 cursor-pointer group mb-1",
            isSelected ? "ring-2 ring-[#4318FF] bg-[#4318FF08]" : "hover:bg-[#F4F7FE]",
            isCurrent && "bg-[#4318FF08]"
        )}
        onClick={onClick}
    >
        {/* Column 1: Clinic Identity */}
        <div className="flex items-center gap-4 min-w-0">
            <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                rank <= 3 ? "bg-[#01B574] text-white" : "bg-white border-2 border-[#F4F7FE] text-slate-400"
            )}>
                {rank}
            </div>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <div className="min-w-0">
                <div className="font-bold text-[15px] flex items-center gap-2 truncate" style={{ color: HORIZON.textPrimary }}>
                    {isCurrent ? 'Ваша Клініка' : name}
                    {isCurrent && (
                        <Badge className="text-[10px] px-2 py-0.5 bg-[#4318FF] text-white border-none rounded-full">
                            ВИ
                        </Badge>
                    )}
                </div>
                <div className="text-[11px] font-medium truncate mt-0.5" style={{ color: HORIZON.textSecondary }}>{url}</div>
            </div>
        </div>

        {/* Column 2: AI Score */}
        <div className="text-right hidden sm:block">
            <div className="text-[15px] font-black" style={{ color: HORIZON.textPrimary }}>{score.toFixed(0)}%</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">AI Score</div>
        </div>

        {/* Column 3: Service Score */}
        <div className="text-right hidden md:block">
            <div className="text-[15px] font-black" style={{ color: HORIZON.c2 }}>{serviceScore.toFixed(0)}%</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Сервіс</div>
        </div>

        {/* Column 4: Visibility */}
        <div className="text-right hidden lg:block">
            <div className="text-[15px] font-black" style={{ color: HORIZON.success }}>{visibility.toFixed(1)}%</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Видимість</div>
        </div>

        {/* Column 5: Position */}
        <div className="text-right hidden xl:block">
            <div className="text-[15px] font-black" style={{ color: HORIZON.warning }}>#{position.toFixed(1)}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Позиція</div>
        </div>

        {/* Column 6: Trend/Growth */}
        <div className="text-right">
            <div className={cn("text-[15px] font-black", trend >= 0 ? "text-[#01B574]" : "text-[#EE5D50]")}>
                {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
            </div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Динаміка</div>
        </div>
    </div>
);

// ============ HORIZON TOOLTIP ============
const HorizonTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-4 rounded-[16px] border-none bg-white" style={{ boxShadow: HORIZON.shadow }}>
                <p className="text-xs font-bold mb-3" style={{ color: HORIZON.textSecondary }}>{label}</p>
                <div className="space-y-2">
                    {payload.map((entry, i) => (
                        <div key={i} className="flex items-center justify-between gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-sm font-medium" style={{ color: HORIZON.textPrimary }}>
                                    {entry.name === 'you' ? 'Ви' : entry.name}
                                </span>
                            </div>
                            <span className="text-sm font-bold" style={{ color: HORIZON.textPrimary }}>
                                {(entry.value || 0).toFixed(1)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

// ============ SCATTER LABEL COMPONENT ============
interface ScatterLabelProps {
    x?: number;
    y?: number;
    value?: string;
    payload?: { name?: string };
}

const ScatterLabel = (props: ScatterLabelProps) => {
    const { x, y, value, payload } = props;
    if (!x || !y) return null;
    const nameValue = value || payload?.name || '';
    const name = nameValue === 'you' ? 'Ваша Клініка' : nameValue;
    if (!name) return null;

    return (
        <text x={x} y={y} dx={12} dy={0} fontSize="10" fontWeight="600" fill={HORIZON.textSecondary} textAnchor="start">
            {name}
        </text>
    );
};

// ============ MAIN COMPONENT ============
export function CompetitorsHorizon() {
    const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
    const [selectedService, setSelectedService] = useState('gynecology');
    const [timeRange, setTimeRange] = useState('6m');
    const [searchQuery, setSearchQuery] = useState('');

    // --- Services List ---
    const services = useMemo(() => [
        "УЗД Сердця", "УЗД Голови", "Консультація дерматолога",
        "Консультація хірурга", "Консультація ЛОР", "Мамографія",
        "УЗД Черевної порожнини", "Консультація офтальмолога"
    ], []);

    // --- Competitors Data ---
    const competitors = useMemo(() => [
        { id: 'c1', name: 'Кл. Чудайкіна', color: HORIZON.c1, url: 'chudaikina.com', score: 75, serviceScore: 68, visibility: 55, position: 3.8, trend: 2.4 },
        { id: 'c2', name: 'Sobco Clinic', color: HORIZON.c2, url: 'sobco.ua', score: 88, serviceScore: 82, visibility: 77, position: 2.1, trend: 1.8 },
        { id: 'c3', name: 'Planeta Zdorovya', color: HORIZON.c3, url: 'planeta.dp.ua', score: 51, serviceScore: 45, visibility: 42, position: 5.5, trend: -0.5 },
        { id: 'c4', name: 'Dopelclinic', color: HORIZON.c4, url: 'dopel.dp.ua', score: 30, serviceScore: 28, visibility: 25, position: 8.2, trend: -2.1 },
        { id: 'c5', name: 'Oxford Med', color: HORIZON.c5, url: 'oxford-med.ua', score: 15, serviceScore: 12, visibility: 18, position: 12.5, trend: 0.3 },
        { id: 'c6', name: 'JMC Center', color: HORIZON.c6, url: 'jmc.org.ua', score: 62, serviceScore: 58, visibility: 48, position: 4.5, trend: 3.2 },
        { id: 'c7', name: 'Garvis Med', color: HORIZON.c7, url: 'garvis.com.ua', score: 45, serviceScore: 40, visibility: 38, position: 6.8, trend: 1.1 },
        { id: 'c8', name: 'Medical Star', color: HORIZON.c8, url: 'medstar.ua', score: 20, serviceScore: 18, visibility: 12, position: 15.2, trend: -1.5 },
        { id: 'c9', name: 'Daily Med', color: HORIZON.c9, url: 'dailymed.dp.ua', score: 92, serviceScore: 88, visibility: 85, position: 1.5, trend: 4.2 },
        { id: 'c10', name: 'Zdorovya Plus', color: HORIZON.c10, url: 'zdorovya.ua', score: 55, serviceScore: 50, visibility: 51, position: 5.2, trend: 0.8 },
    ], []);

    const currentClinic = useMemo(() => ({
        id: 'you',
        name: 'Ваша Клініка',
        color: HORIZON.you,
        url: 'your-clinic.ua',
        score: 72.8,
        serviceScore: 65,
        visibility: 61,
        position: 3.2,
        trend: 5.2
    }), []);

    // --- 7 KPI Cards (Analysis opportunity) ---
    const kpis = useMemo(() => [
        { label: 'ClinicAI Score', value: '51%', benchmark: '70%', trend: '+15%', icon: BrainCircuit, iconBg: HORIZON.primaryLight, iconColor: HORIZON.primary },
        { label: 'Показник видимості', value: '31%', benchmark: '74%', trend: '+22%', icon: Target, iconBg: HORIZON.successLight, iconColor: HORIZON.success },
        { label: 'Середня позиція', value: '3/14', benchmark: '7/10', trend: '+1.5', icon: Activity, iconBg: HORIZON.errorLight, iconColor: HORIZON.error },
        { label: 'Кількість сервісів', value: '95%', benchmark: '75%', trend: '+20%', icon: Zap, iconBg: HORIZON.infoLight, iconColor: HORIZON.info },
        { label: 'Оптимізація контенту', value: '91%', benchmark: '70%', trend: '+21%', icon: LayoutGrid, iconBg: HORIZON.primaryLight, iconColor: HORIZON.c2 },
        { label: 'E-E-A-T сигнали', value: '93%', benchmark: '75%', trend: '+18%', icon: Sparkles, iconBg: HORIZON.warningLight, iconColor: HORIZON.warning },
        { label: 'Локальні показники', value: '59%', benchmark: '74%', trend: '-15%', icon: Globe, iconBg: HORIZON.successLight, iconColor: HORIZON.c3 },
    ], []);

    // --- Map Data ---
    const mapData = useMemo(() => [
        { x: currentClinic.position, y: currentClinic.score, name: 'you', isCurrent: true, color: HORIZON.you, url: 'your-clinic.ua' },
        ...competitors.map((c, i) => ({
            x: [2.1, 4.2, 1.5, 6.5, 8.2, 3.8, 5.5, 7.1, 1.8, 4.9][i],
            y: c.score,
            name: c.name,
            isCurrent: false,
            color: c.color,
            url: c.url
        }))
    ], [competitors, currentClinic]);

    // --- Dynamics Data ---
    const dynamics = useMemo(() => {
        const months = ['Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер'];
        return months.map((m, mi) => {
            const row: Record<string, number | string> = { period: m };
            row.you = 60 + Math.sin(mi) * 10 + (selectedService === 'gynecology' ? 5 : 0);
            competitors.forEach((c, ci) => {
                row[c.id] = 50 + Math.cos(mi + ci) * 15;
            });
            row.market = 55 + Math.sin(mi * 0.5) * 5;
            return row;
        });
    }, [selectedService, competitors]);

    // --- Service Gap Data ---
    const gapData = useMemo(() => services.map((s, i) => ({
        service: s,
        diff: [22, -15, 10, -25, 18, -12, 8, -5][i % 8]
    })), [services]);

    // --- Distribution Data ---
    const distributionData = useMemo(() => services.map((s, i) => {
        const row: Record<string, number | string> = { service: s };
        row.you = [45, 52, 68, 35, 72, 58, 44, 61][i % 8] ?? 0;
        row.c1 = [60, 48, 75, 42, 65, 50, 55, 48][i % 8] ?? 0;
        row.c2 = [30, 85, 40, 92, 25, 70, 68, 35][i % 8] ?? 0;
        return row;
    }), [services]);

    // --- Signals Data ---
    const signals = useMemo(() => [
        ...competitors.slice(0, 10).map(c => ({ name: c.name.split(' ')[0], v: 50 + Math.random() * 40, f: c.color })),
        { name: 'Ви', v: 90, f: HORIZON.you },
    ], [competitors]);

    // --- Sorted list ---
    const allSorted = useMemo(() => {
        const filtered = searchQuery
            ? competitors.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
            : competitors;
        const all = [{ ...currentClinic, isCurrent: true }, ...filtered.map(c => ({ ...c, isCurrent: false }))];
        return all.sort((a, b) => b.score - a.score);
    }, [currentClinic, competitors, searchQuery]);



    return (
        <div className="space-y-6 pb-20" style={{ backgroundColor: HORIZON.background, margin: '-2rem', padding: '2rem', minHeight: '100vh' }}>

            {/* ========== HEADER ========== */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: HORIZON.textPrimary }}>
                        Аналіз конкурентів
                    </h1>
                    <p className="text-sm mt-1" style={{ color: HORIZON.textSecondary }}>
                        Відстежуйте та аналізуйте свої конкурентні позиції на ринку
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: HORIZON.textSecondary }} />
                        <Input
                            placeholder="Пошук конкурентів..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-64 rounded-xl border-none bg-white h-11 font-medium"
                            style={{ boxShadow: HORIZON.shadowSm, color: HORIZON.textPrimary }}
                        />
                    </div>
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-32 rounded-xl border-none bg-white h-11 font-medium" style={{ boxShadow: HORIZON.shadowSm }}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="1m">1 Місяць</SelectItem>
                            <SelectItem value="3m">3 Місяці</SelectItem>
                            <SelectItem value="6m">6 Місяців</SelectItem>
                            <SelectItem value="1y">1 Рік</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="rounded-xl bg-white h-11 w-11" style={{ boxShadow: HORIZON.shadowSm }}>
                        <RefreshCw className="w-4 h-4" style={{ color: HORIZON.textSecondary }} />
                    </Button>
                    <Button className="rounded-xl h-11 px-5 font-semibold text-white" style={{ backgroundColor: HORIZON.primary }}>
                        <Download className="w-4 h-4 mr-2" />
                        Експорт
                    </Button>
                </div>
            </div>



            {/* ========== ANALYSIS OPPORTUNITY (KPI CARDS) ========== */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2 ml-1">
                    <Target className="w-5 h-5" style={{ color: HORIZON.primary }} />
                    <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: HORIZON.textPrimary }}>Можливості аналізу</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                    {kpis.map((kpi, i) => (
                        <KpiCard key={i} {...kpi} />
                    ))}
                </div>
            </section>

            {/* ========== MAIN ANALYTICS: SCATTER + LIST (Full Width per design) ========== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Market Position Matrix */}
                <HorizonCard className="lg:col-span-12" title="Матриця ринкових позицій" subtitle="ClinicAI Score vs. Середня позиція"
                    action={<Button variant="ghost" size="icon" className="rounded-xl"><MoreHorizontal className="w-5 h-5" style={{ color: HORIZON.textSecondary }} /></Button>}>
                    <div className="h-[450px] relative">
                        {/* Quadrant Labels */}
                        <div className="absolute inset-0 flex pointer-events-none">
                            <div className="flex-1 flex items-center justify-center border-r border-b border-dashed" style={{ borderColor: '#E9EDF7' }}>
                                <span className="text-2xl font-bold opacity-5 uppercase italic" style={{ color: HORIZON.textPrimary }}>КОНСЕРВАТОРИ</span>
                            </div>
                            <div className="flex-1 flex items-center justify-center border-b border-dashed" style={{ borderColor: '#E9EDF7' }}>
                                <span className="text-2xl font-bold opacity-5 uppercase italic" style={{ color: HORIZON.textPrimary }}>ПРЕТЕНДЕНТИ</span>
                            </div>
                        </div>
                        <div className="absolute inset-0 flex pointer-events-none mt-[225px]">
                            <div className="flex-1 flex items-center justify-center border-r border-dashed" style={{ borderColor: '#E9EDF7' }}>
                                <span className="text-2xl font-bold opacity-5 uppercase italic" style={{ color: HORIZON.textPrimary }}>НІШЕВІ</span>
                            </div>
                            <div className="flex-1 flex items-center justify-center">
                                <span className="text-2xl font-bold opacity-5 uppercase italic" style={{ color: HORIZON.textPrimary }}>ДОМІНАНТИ</span>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 100, bottom: 20, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9EDF7" />
                                <XAxis type="number" dataKey="x" name="Позиція" domain={[10, 1]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: HORIZON.textSecondary }} />
                                <YAxis type="number" dataKey="y" name="Оцінка/Score" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: HORIZON.textSecondary }} />
                                <ZAxis range={[200, 600]} />
                                <Tooltip content={<HorizonTooltip />} cursor={{ strokeDasharray: '3 3', stroke: HORIZON.secondary }} />
                                <Scatter name="Clinics" data={mapData}>
                                    {mapData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} className="cursor-pointer transition-opacity duration-200 hover:opacity-70"
                                            stroke={entry.isCurrent ? 'white' : 'transparent'} strokeWidth={entry.isCurrent ? 4 : 0} />
                                    ))}
                                    <LabelList dataKey="name" content={<ScatterLabel />} />
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Legend per design */}
                    <div className="flex items-center gap-6 mt-4 pt-4 border-t" style={{ borderColor: HORIZON.background }}>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: HORIZON.you }} />
                            <span className="text-xs font-bold" style={{ color: HORIZON.textPrimary }}>Ви (Ваша клініка)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: HORIZON.success }} />
                            <span className="text-xs font-bold" style={{ color: HORIZON.textPrimary }}>Lead</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: HORIZON.secondary }} />
                            <span className="text-xs font-bold" style={{ color: HORIZON.textPrimary }}>Follow</span>
                        </div>
                    </div>
                </HorizonCard>

                {/* Top Competitors List */}
                <HorizonCard className="lg:col-span-12" title="ТОП-10 лідерів ринку" subtitle={`${allSorted.length} клінік у розширеному аналізі`} noPadding
                    action={<Button variant="ghost" size="icon" className="rounded-xl"><Filter className="w-4 h-4" style={{ color: HORIZON.textSecondary }} /></Button>}>
                    {/* Table Headers */}
                    <div className="px-8 pt-3 pb-2 grid grid-cols-6 border-b" style={{ borderColor: HORIZON.background }}>
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: HORIZON.textSecondary }}>Клініка</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-right hidden sm:block" style={{ color: HORIZON.textSecondary }}>AI Score</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-right hidden md:block" style={{ color: HORIZON.textSecondary }}>Сервіс</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-right hidden lg:block" style={{ color: HORIZON.textSecondary }}>Видимість</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-right hidden xl:block" style={{ color: HORIZON.textSecondary }}>Позиція</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-right" style={{ color: HORIZON.textSecondary }}>Динаміка</span>
                    </div>
                    <div className="p-4 pt-2 space-y-1">
                        {allSorted.map((item, i) => {
                            const competitor = item as {
                                id: string; name: string; url: string; score: number;
                                serviceScore?: number; visibility?: number; position?: number;
                                trend: number; color: string; isCurrent?: boolean;
                            };
                            return (
                                <CompetitorRow
                                    key={competitor.id}
                                    rank={i + 1}
                                    name={competitor.name}
                                    url={competitor.url}
                                    score={competitor.score}
                                    serviceScore={competitor.serviceScore ?? competitor.score * 0.9}
                                    visibility={competitor.visibility ?? 40}
                                    position={competitor.position ?? 5.0}
                                    trend={competitor.trend}
                                    color={competitor.color}
                                    isCurrent={competitor.isCurrent}
                                    isSelected={selectedCompetitor === competitor.id}
                                    onClick={() => setSelectedCompetitor(competitor.id === selectedCompetitor ? null : competitor.id)}
                                />
                            );
                        })}
                    </div>
                </HorizonCard>
            </div>

            {/* ========== DYNAMICS SUITE ========== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Growth Dynamics */}
                <HorizonCard title="Динаміка ClinicAI Score" subtitle="Швидкість зміни показників за місяць">
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dynamics}>
                                <defs>
                                    <linearGradient id="horizonGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={HORIZON.primary} stopOpacity={0.2} />
                                        <stop offset="95%" stopColor={HORIZON.primary} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E9EDF7" />
                                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: HORIZON.textSecondary }} />
                                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: HORIZON.textSecondary }} />
                                <Tooltip content={<HorizonTooltip />} />
                                {competitors.slice(0, 3).map((c) => (
                                    <Area key={c.id} type="monotone" dataKey={c.id} stroke={c.color} strokeWidth={1} fill="transparent" name={c.name} opacity={0.3} />
                                ))}
                                <Area type="monotone" dataKey="market" stroke={HORIZON.secondary} strokeWidth={2} fill="transparent" strokeDasharray="5 5" name="Market Avg" />
                                <Area type="monotone" dataKey="you" name="Ви" stroke={HORIZON.primary} strokeWidth={4} fillOpacity={1} fill="url(#horizonGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Legend per design */}
                    <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: HORIZON.background }}>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: HORIZON.primary }} />
                            <span className="text-[10px] font-bold" style={{ color: HORIZON.textPrimary }}>Ви</span>
                        </div>
                        {competitors.slice(0, 3).map(c => (
                            <div key={c.id} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                                <span className="text-[10px] font-bold" style={{ color: HORIZON.textSecondary }}>{c.name}</span>
                            </div>
                        ))}
                    </div>
                </HorizonCard>

                {/* Sector Intensity (with Select) */}
                <HorizonCard title="Динаміка AIV Score по послугах" subtitle="Порівняння за секторами"
                    action={
                        <Select value={selectedService} onValueChange={setSelectedService}>
                            <SelectTrigger className="w-44 rounded-xl border-none h-9 text-xs font-medium" style={{ backgroundColor: HORIZON.background }}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="gynecology">Гінекологія</SelectItem>
                                <SelectItem value="ultrasound">УЗД Серця</SelectItem>
                            </SelectContent>
                        </Select>
                    }>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dynamics}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E9EDF7" />
                                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: HORIZON.textSecondary }} />
                                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: HORIZON.textSecondary }} />
                                <Tooltip content={<HorizonTooltip />} />
                                {competitors.slice(0, 5).map((c) => (
                                    <Line key={c.id} type="monotone" dataKey={c.id} stroke={c.color} strokeWidth={1} dot={false} opacity={0.2} name={c.name} />
                                ))}
                                <Line type="stepAfter" dataKey="market" stroke={HORIZON.secondary} strokeWidth={2} dot={false} strokeDasharray="6 6" name="Ринковий орієнтир" />
                                <Line type="monotone" dataKey="you" name="Ваш показник" stroke={HORIZON.primary} strokeWidth={4} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Legend per design */}
                    <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: HORIZON.background }}>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: HORIZON.primary }} />
                            <span className="text-[10px] font-bold" style={{ color: HORIZON.textPrimary }}>Ваша клініка</span>
                        </div>
                        {competitors.slice(0, 5).map(c => (
                            <div key={c.id} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                                <span className="text-[10px] font-bold" style={{ color: HORIZON.textSecondary }}>{c.name}</span>
                            </div>
                        ))}
                    </div>
                </HorizonCard>
            </div>

            {/* ========== SIGNAL AUDIT GRID (4 charts per design) ========== */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 mb-2 ml-1">
                    <Sparkles className="w-5 h-5" style={{ color: HORIZON.primary }} />
                    <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: HORIZON.textPrimary }}>Аналіз конкурентних сигналів</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                        { t: "Конкуренція по ClinicAI Score", i: BrainCircuit },
                        { t: "Конкуренція по Видимості Послуг", i: Target },
                        { t: "Конкуренція по середній позиції", i: Activity },
                        { t: "Конкуренція по оптимізації сайту та відгуках", i: Zap },
                    ].map((m, i) => (
                        <HorizonCard key={i}>
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: HORIZON.textSecondary }}>{m.t}</p>
                                <div className="p-2 rounded-xl" style={{ backgroundColor: HORIZON.background }}>
                                    <m.i className="w-4 h-4" style={{ color: HORIZON.textSecondary }} />
                                </div>
                            </div>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={signals} margin={{ bottom: 30 }}>
                                        <XAxis dataKey="name" hide={false} axisLine={false} tickLine={false} tick={{ fontSize: 8, fontWeight: 600, fill: HORIZON.textSecondary }} angle={-45} textAnchor="end" interval={0} />
                                        <Bar dataKey="v" radius={[4, 4, 0, 0]} barSize={16}>
                                            {signals.map((s, idx) => (
                                                <Cell key={idx} fill={s.f} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-between items-end mt-4 pt-4 border-t" style={{ borderColor: HORIZON.background }}>
                                <span className="text-xs font-semibold" style={{ color: HORIZON.textSecondary }}>Rank</span>
                                <span className="text-lg font-bold" style={{ color: HORIZON.primary }}>#{i + 4}</span>
                            </div>
                        </HorizonCard>
                    ))}
                </div>
            </section>

            {/* ========== DIAGNOSTIC SUITE ========== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Service Distribution */}
                <HorizonCard title="Розподіл AIV Score по послугах" subtitle="Щільність метрик за підрозділами">
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={distributionData} margin={{ left: 80, right: 60 }} barGap={3}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="service" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: HORIZON.textSecondary }} width={100} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                                <Bar dataKey="you" fill={HORIZON.primary} barSize={8} radius={[0, 10, 10, 0]} name="Ви">
                                    <LabelList dataKey="you" position="right" style={{ fontSize: '9px', fontWeight: 600, fill: HORIZON.primary }} formatter={(v: number | string) => `${Number(v).toFixed(0)}%`} />
                                </Bar>
                                <Bar dataKey="c1" fill="#E9EDF7" barSize={8} radius={[0, 10, 10, 0]} name="Кл. Чудайкіна" />
                                <Bar dataKey="c2" fill="#F4F7FE" barSize={8} radius={[0, 10, 10, 0]} name="Sobco Clinic" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </HorizonCard>

                {/* Service Gap Analysis */}
                <HorizonCard title="Gap аналіз по послугах" subtitle="Стратегічне відхилення по секторах">
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart layout="vertical" data={gapData} margin={{ left: 100, right: 60 }}>
                                <CartesianGrid horizontal={false} stroke="#E9EDF7" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="service" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: HORIZON.textSecondary }} width={100} />
                                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                                <ReferenceLine x={0} stroke={HORIZON.secondary} strokeWidth={2} />
                                <Bar dataKey="diff" barSize={14} radius={[10, 10, 10, 10]}>
                                    <LabelList dataKey="diff" position="right" style={{ fontSize: '10px', fontWeight: 600, fill: HORIZON.textPrimary }} formatter={(v: number) => v > 0 ? `+${v}%` : `${v}%`} />
                                    {gapData.map((entry, index) => (
                                        <Cell key={index} fill={(entry.diff || 0) < 0 ? HORIZON.error : HORIZON.success} fillOpacity={0.8} />
                                    ))}
                                </Bar>
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </HorizonCard>
            </div>



        </div>
    );
}
