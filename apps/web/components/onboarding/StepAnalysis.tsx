'use client';

import React from 'react';
import { Button } from '@kit/ui/button';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { TrendingUp } from 'lucide-react';

// Horizon UI Design Tokens
const HORIZON = {
    primary: '#4318FF',
    primaryLight: '#4318FF15',
    secondary: '#A3AED0',
    success: '#01B574',
    background: '#F4F7FE',
    textPrimary: '#1B2559',
    textSecondary: '#A3AED0',
    shadow: '0 18px 40px rgba(112, 144, 176, 0.12)',
};

interface StepAnalysisProps {
    onContinue: () => void;
}

export function StepAnalysis({ onContinue }: StepAnalysisProps) {
    return (
        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-bold mb-6 leading-tight" style={{ color: HORIZON.textPrimary }}>
                We run your prompts daily to analyze your brand&apos;s performance
            </h1>

            <p className="text-lg mb-10 leading-relaxed font-normal" style={{ color: HORIZON.textSecondary }}>
                We look for your brand in answers, citations, and mentions to understand
                how you&apos;re showing up in ChatGPT, Google AI Overviews, Perplexity, Microsoft Copilot, and more.
            </p>

            <Button
                onClick={onContinue}
                className="w-full lg:w-fit px-12 py-6 text-lg text-white rounded-xl transition-all hover:-translate-y-0.5 font-semibold"
                style={{
                    backgroundColor: HORIZON.primary,
                    boxShadow: `0 15px 30px ${HORIZON.primary}30`
                }}
            >
                Continue
            </Button>
        </div>
    );
}

const data = [
    { name: 'Day 1', visibility: 12 },
    { name: 'Day 5', visibility: 18 },
    { name: 'Day 10', visibility: 25 },
    { name: 'Day 15', visibility: 42 },
    { name: 'Day 20', visibility: 58 },
    { name: 'Day 25', visibility: 72 },
    { name: 'Day 30', visibility: 85 },
];

export function VisualAnalysis() {
    const [score, setScore] = React.useState(0);
    const [citations, setCitations] = React.useState(0);

    // Counter animations - preserved
    React.useEffect(() => {
        const scoreInterval = setInterval(() => {
            setScore(prev => prev < 85 ? prev + 1 : 85);
        }, 30);
        const citationInterval = setInterval(() => {
            setCitations(prev => prev < 1240 ? prev + 20 : 1240);
        }, 20);
        return () => {
            clearInterval(scoreInterval);
            clearInterval(citationInterval);
        };
    }, []);

    return (
        <div className="space-y-6 flex flex-col items-center w-full animate-in zoom-in-95 duration-700">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 w-full">
                <div
                    className="rounded-[20px] p-6"
                    style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
                >
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-center" style={{ color: HORIZON.textSecondary }}>AI Visibility</p>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-4xl font-black" style={{ color: HORIZON.textPrimary }}>{score}%</span>
                        <div className="flex items-center gap-0.5 font-bold text-xs" style={{ color: HORIZON.success }}>
                            <TrendingUp size={12} />
                            +{(score * 0.4).toFixed(1)}%
                        </div>
                    </div>
                </div>
                <div
                    className="rounded-[20px] p-6"
                    style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
                >
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-center" style={{ color: HORIZON.textSecondary }}>Daily Citations</p>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-4xl font-black" style={{ color: HORIZON.textPrimary }}>{citations.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Card: Visibility Chart */}
            <div
                className="rounded-[20px] p-8 w-full relative overflow-hidden"
                style={{ backgroundColor: 'white', boxShadow: HORIZON.shadow }}
            >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <TrendingUp className="w-32 h-32 rotate-12" style={{ color: HORIZON.primary }} />
                </div>

                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider mb-1 text-left" style={{ color: HORIZON.textSecondary }}>Visibility Growth</p>
                        <h3 className="text-2xl font-bold" style={{ color: HORIZON.textPrimary }}>Projected Performance</h3>
                    </div>
                    <div
                        className="px-3 py-1 rounded-lg text-xs font-bold"
                        style={{ backgroundColor: HORIZON.primaryLight, color: HORIZON.primary, border: `1px solid ${HORIZON.primary}30` }}
                    >
                        30 Day Simulation
                    </div>
                </div>

                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <defs>
                                <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="100%">
                                    <stop offset="5%" stopColor={HORIZON.primary} stopOpacity={0.1} />
                                    <stop offset="95%" stopColor={HORIZON.primary} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={HORIZON.background} />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: HORIZON.textSecondary, fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: HORIZON.textSecondary, fontWeight: 600 }}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: HORIZON.shadow }}
                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            />
                            {/* Chart line animation preserved */}
                            <Line
                                type="monotone"
                                dataKey="visibility"
                                stroke={HORIZON.primary}
                                strokeWidth={4}
                                dot={{ fill: HORIZON.primary, r: 4, strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: HORIZON.primary }}
                                animationDuration={2000}
                                animationEasing="ease-in-out"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
