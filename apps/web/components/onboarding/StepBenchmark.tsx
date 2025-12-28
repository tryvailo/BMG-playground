'use client';

import React from 'react';
import { Button } from '@kit/ui/button';
import { TrendingDown, Search } from 'lucide-react';
import { cn } from '@kit/ui/utils';

interface StepBenchmarkProps {
    onContinue: () => void;
    clinicName?: string;
}

export function StepBenchmark({ onContinue, clinicName = 'My Clinic' }: StepBenchmarkProps) {
    return (
        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Platform Icons */}
            <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 rounded-md bg-zinc-900 flex items-center justify-center p-1">
                    <svg viewBox="0 0 24 24" fill="white"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-4.7471-3.124 5.9847 5.9847 0 0 0-5.188-1.5547 6.0462 6.0462 0 0 0-4.667 3.243 5.9847 5.9847 0 0 0-.5157 4.9108 6.0462 6.0462 0 0 0-3.321 4.615 5.9847 5.9847 0 0 0 1.5547 5.188 6.0462 6.0462 0 0 0 3.243 4.667 5.9847 5.9847 0 0 0 4.9108.5157 6.0462 6.0462 0 0 0 4.615 3.321 5.9847 5.9847 0 0 0 5.188-1.5547 6.0462 6.0462 0 0 0 4.667-3.243 5.9847 5.9847 0 0 0 .5157-4.9108 6.0462 6.0462 0 0 0 3.321-4.615 5.9847 5.9847 0 0 0-1.5547-5.188 6.0462 6.0462 0 0 0-3.243-4.667zm-2.127 8.018a4.479 4.479 0 0 1-2.427 2.404l-.147.06-.015.158a4.438 4.438 0 0 1-1.155 2.628 4.479 4.479 0 0 1-3.865 1.155l-.158-.023-.105.12a4.438 4.438 0 0 1-2.427 1.411 4.479 4.479 0 0 1-4.041-2.381l-.098-.165-.181.015a4.438 4.438 0 0 1-2.628-1.155 4.479 4.479 0 0 1-1.155-3.865l.023-.158-.12-.105a4.438 4.438 0 0 1-1.411-2.427 4.479 4.479 0 0 1 2.381-4.041l.165-.098-.015-.181a4.438 4.438 0 0 1 1.155-2.628 4.479 4.479 0 0 1 3.865-1.155l.158.023.105-.12a4.438 4.438 0 0 1 2.427-1.411 4.479 4.479 0 0 1 4.041 2.381l.098.165.181-.015a4.438 4.438 0 0 1 2.628 1.155 4.479 4.479 0 0 1 1.155 3.865l-.023.158.12.105a4.438 4.438 0 0 1 1.411 2.427 4.479 4.479 0 0 1-2.381 4.041l-.165.098.015.181zM11.4785 15.657l-3.321-3.321 1.1325-1.1325 2.1885 2.1885 4.908-4.908 1.1325 1.1325-6.0405 6.0405z" /></svg>
                </div>
                <div className="w-6 h-6 rounded-md bg-teal-500 flex items-center justify-center p-1">
                    <svg viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                </div>
                <div className="w-6 h-6 rounded-md bg-blue-500 flex items-center justify-center p-1">
                    <svg viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                </div>
                <div className="w-6 h-6 rounded-md bg-purple-500 flex items-center justify-center p-1">
                    <svg viewBox="0 0 24 24" fill="white"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2V9h-2V7h4v10z" /></svg>
                </div>
            </div>

            <h1 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">
                {clinicName}'s AI visibility is below industry benchmarks
            </h1>

            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                Let's fix that — we've already found 5+ opportunities to improve {clinicName}'s visibility.
            </p>

            <Button
                onClick={onContinue}
                className="w-full lg:w-fit px-12 py-6 text-lg bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xl shadow-teal-100 hover:shadow-teal-200 transition-all"
            >
                Continue
            </Button>
        </div>
    );
}

interface VisualBenchmarkProps {
    clinicName?: string;
}

export function VisualBenchmark({ clinicName = 'My Clinic' }: VisualBenchmarkProps) {
    const [isScanning, setIsScanning] = React.useState(true);

    React.useEffect(() => {
        const timer = setTimeout(() => setIsScanning(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    const competitors = [
        { rank: 1, name: 'UnitedHealth Group', score: '94%' },
        { rank: 2, name: 'CVS Health', score: '88%' },
        { rank: 3, name: 'McKesson Corp.', score: '85%' },
        { rank: 4, name: 'Oracle Health', score: '82%' },
        { rank: 21, name: clinicName, current: true, score: '12%' },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-700 relative">
            {/* Scanning Overlay */}
            {isScanning && (
                <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-8 text-center animate-out fade-out duration-500 fill-mode-forwards delay-1500">
                    <div className="relative w-20 h-20 mb-6">
                        <div className="absolute inset-0 rounded-full border-4 border-teal-100" />
                        <div className="absolute inset-0 rounded-full border-4 border-teal-600 border-t-transparent animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="text-teal-600 w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Analyzing Industry</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">Checking visibility across 500+ clinics...</p>
                </div>
            )}

            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Industry Ranking</span>
                <span className="text-xs font-bold text-slate-900 px-2 py-1 bg-slate-100 rounded-md">Healthcare</span>
            </div>

            <div className="divide-y divide-slate-50">
                {competitors.map((item, i) => (
                    <div
                        key={item.rank}
                        style={{ animationDelay: `${isScanning ? 2000 + (i * 100) : i * 100}ms` }}
                        className={cn(
                            "px-6 py-4 flex items-center justify-between transition-all duration-500",
                            isScanning ? "opacity-0 translate-y-4" : "animate-in fade-in slide-in-from-bottom-2",
                            item.current ? 'bg-teal-50/50' : 'hover:bg-slate-50/30'
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-slate-400 w-6">#{item.rank}</span>
                            <div className="relative">
                                {item.current ? (
                                    <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-100">
                                        <div className="w-4 h-4">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                            </svg>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200" />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-sm ${item.current ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                                    {item.name}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-1000 delay-1000",
                                                item.current ? "bg-red-500" : "bg-teal-500"
                                            )}
                                            style={{ width: isScanning ? '0%' : item.score }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">{item.score}</span>
                                </div>
                            </div>
                        </div>

                        {item.current && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-100 animate-pulse">
                                <TrendingDown size={14} className="text-red-500" />
                                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Critical</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
