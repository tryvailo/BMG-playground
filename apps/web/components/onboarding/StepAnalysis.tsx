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
import { Loader2, Plus, TrendingUp } from 'lucide-react';

interface StepAnalysisProps {
    onContinue: () => void;
}

export function StepAnalysis({ onContinue }: StepAnalysisProps) {
    return (
        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-bold text-slate-900 mb-6 leading-tight">
                We run your prompts daily to analyze your brand's performance
            </h1>

            <p className="text-lg text-slate-600 mb-10 leading-relaxed font-normal">
                We look for your brand in answers, citations, and mentions to understand
                how you're showing up in ChatGPT, Google AI Overviews, Perplexity, Microsoft Copilot, and more.
            </p>

            <Button
                onClick={onContinue}
                className="w-full lg:w-fit px-12 py-6 text-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xl shadow-teal-100 hover:shadow-teal-200 rounded-xl transition-all"
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
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">AI Visibility</p>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-4xl font-black text-slate-900">{score}%</span>
                        <div className="flex items-center gap-0.5 text-green-500 font-bold text-xs">
                            <TrendingUp size={12} />
                            +{(score * 0.4).toFixed(1)}%
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">Daily Citations</p>
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-4xl font-black text-slate-900">{citations.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Bottom Card: Visibility Chart */}
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 w-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <TrendingUp className="w-32 h-32 text-teal-600 rotate-12" />
                </div>

                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 text-left">Visibility Growth</p>
                        <h3 className="text-2xl font-bold text-slate-900">Projected Performance</h3>
                    </div>
                    <div className="px-3 py-1 bg-teal-50 text-teal-600 border border-teal-100 rounded-lg text-xs font-bold">
                        30 Day Simulation
                    </div>
                </div>

                <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <defs>
                                <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="100%">
                                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                                tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="visibility"
                                stroke="#0d9488"
                                strokeWidth={4}
                                dot={{ fill: '#0d9488', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#0d9488' }}
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
