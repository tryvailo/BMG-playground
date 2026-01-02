'use client';

import React from 'react';
import { Button } from '@kit/ui/button';
import { TrendingDown } from 'lucide-react';
import { cn } from '@kit/ui/utils';

// Horizon UI Design Tokens
const HORIZON = {
    primary: '#4318FF',
    primaryLight: '#4318FF15',
    secondary: '#A3AED0',
    success: '#01B574',
    error: '#EE5D50',
    background: '#F4F7FE',
    textPrimary: '#1B2559',
    textSecondary: '#A3AED0',
    shadow: '0 18px 40px rgba(112, 144, 176, 0.12)',
};

interface Competitor {
    name: string;
    url: string;
}

interface StepBenchmarkProps {
    onContinue: () => void;
    clinicName?: string;
    competitors?: Competitor[];
}

export function StepBenchmark({ onContinue, clinicName = 'My Clinic', competitors: _competitors = [] }: StepBenchmarkProps) {
    return (
        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Platform Icons */}
            <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 rounded-md flex items-center justify-center p-1" style={{ backgroundColor: HORIZON.textPrimary }}>
                    <svg viewBox="0 0 24 24" fill="white"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-4.7471-3.124 5.9847 5.9847 0 0 0-5.188-1.5547 6.0462 6.0462 0 0 0-4.667 3.243 5.9847 5.9847 0 0 0-.5157 4.9108 6.0462 6.0462 0 0 0-3.321 4.615 5.9847 5.9847 0 0 0 1.5547 5.188 6.0462 6.0462 0 0 0 3.243 4.667 5.9847 5.9847 0 0 0 4.9108.5157 6.0462 6.0462 0 0 0 4.615 3.321 5.9847 5.9847 0 0 0 5.188-1.5547 6.0462 6.0462 0 0 0 4.667-3.243 5.9847 5.9847 0 0 0 .5157-4.9108 6.0462 6.0462 0 0 0 3.321-4.615 5.9847 5.9847 0 0 0-1.5547-5.188 6.0462 6.0462 0 0 0-3.243-4.667zm-2.127 8.018a4.479 4.479 0 0 1-2.427 2.404l-.147.06-.015.158a4.438 4.438 0 0 1-1.155 2.628 4.479 4.479 0 0 1-3.865 1.155l-.158-.023-.105.12a4.438 4.438 0 0 1-2.427 1.411 4.479 4.479 0 0 1-4.041-2.381l-.098-.165-.181.015a4.438 4.438 0 0 1-2.628-1.155 4.479 4.479 0 0 1-1.155-3.865l.023-.158-.12-.105a4.438 4.438 0 0 1-1.411-2.427 4.479 4.479 0 0 1 2.381-4.041l.165-.098-.015-.181a4.438 4.438 0 0 1 1.155-2.628 4.479 4.479 0 0 1 3.865-1.155l.158.023.105-.12a4.438 4.438 0 0 1 2.427-1.411 4.479 4.479 0 0 1 4.041 2.381l.098.165.181-.015a4.438 4.438 0 0 1 2.628 1.155 4.479 4.479 0 0 1 1.155 3.865l-.023.158.12.105a4.438 4.438 0 0 1 1.411 2.427 4.479 4.479 0 0 1-2.381 4.041l-.165.098.015.181zM11.4785 15.657l-3.321-3.321 1.1325-1.1325 2.1885 2.1885 4.908-4.908 1.1325 1.1325-6.0405 6.0405z" /></svg>
                </div>
                <div className="w-6 h-6 rounded-md flex items-center justify-center p-1" style={{ backgroundColor: HORIZON.primary }}>
                    <svg viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                </div>
                <div className="w-6 h-6 rounded-md flex items-center justify-center p-1" style={{ backgroundColor: HORIZON.success }}>
                    <svg viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                </div>
                <div className="w-6 h-6 rounded-md flex items-center justify-center p-1" style={{ backgroundColor: '#7551FF' }}>
                    <svg viewBox="0 0 24 24" fill="white"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2V9h-2V7h4v10z" /></svg>
                </div>
            </div>

            <h1 className="text-4xl font-bold mb-4 leading-tight" style={{ color: HORIZON.textPrimary }}>
                {clinicName}&apos;s AI visibility is below industry benchmarks
            </h1>

            <p className="text-lg mb-10 leading-relaxed" style={{ color: HORIZON.textSecondary }}>
                Let&apos;s fix that — we&apos;ve already found 5+ opportunities to improve {clinicName}&apos;s visibility.
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

interface VisualBenchmarkProps {
    clinicName?: string;
    competitors?: Competitor[];
}

export function VisualBenchmark({ clinicName = 'My Clinic', competitors: propCompetitors = [] }: VisualBenchmarkProps) {
    const [isScanning, setIsScanning] = React.useState(true);

    React.useEffect(() => {
        const timer = setTimeout(() => setIsScanning(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    // Use provided competitors if available (for Ukraine), otherwise use default
    const hasUkraineCompetitors = propCompetitors.length > 0;
    
    // Deterministic score generation based on index to avoid hydration mismatch
    const getScoreForRank = (rank: number) => {
        const scores = [94, 88, 85, 82, 79, 76, 73, 70];
        return `${scores[(rank - 1) % scores.length]}%`;
    };
    
    const competitors: { rank: number; name: string; score: string; current?: boolean }[] = hasUkraineCompetitors
        ? [
            ...propCompetitors.slice(0, 4).map((comp, i) => ({
                rank: i + 1,
                name: comp.name,
                score: getScoreForRank(i + 1),
            })),
            { rank: 18, name: clinicName, current: true, score: '12%' },
          ]
        : [
            { rank: 1, name: 'UnitedHealth Group', score: '94%' },
            { rank: 2, name: 'CVS Health', score: '88%' },
            { rank: 3, name: 'McKesson Corp.', score: '85%' },
            { rank: 4, name: 'Oracle Health', score: '82%' },
            { rank: 18, name: clinicName, current: true, score: '12%' },
          ];

    return (
        <div
            className="rounded-[20px] overflow-hidden animate-in zoom-in-95 duration-700 relative"
            style={{
                backgroundColor: 'white',
                boxShadow: HORIZON.shadow
            }}
        >
            {/* Scanning Overlay - Animation preserved */}
            {isScanning && (
                <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-8 text-center animate-out fade-out duration-500 fill-mode-forwards delay-1500">
                    <div className="relative w-20 h-20 mb-6">
                        <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: HORIZON.primaryLight }} />
                        <div className="absolute inset-0 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: HORIZON.primary, borderTopColor: 'transparent' }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-8 h-8" style={{ color: HORIZON.primary }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                            </svg>
                        </div>
                    </div>
                    <h3 className="text-lg font-bold mb-2" style={{ color: HORIZON.textPrimary }}>Analyzing Industry</h3>
                    <p className="text-sm font-medium leading-relaxed" style={{ color: HORIZON.textSecondary }}>Checking visibility across 500+ clinics...</p>
                </div>
            )}

            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${HORIZON.background}` }}>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: HORIZON.textSecondary }}>Industry Ranking</span>
                <span className="text-xs font-bold px-2 py-1 rounded-md" style={{ backgroundColor: HORIZON.background, color: HORIZON.textPrimary }}>Healthcare</span>
            </div>

            <div>
                {competitors.map((item, i) => (
                    <div
                        key={item.rank}
                        style={{
                            animationDelay: `${isScanning ? 2000 + (i * 100) : i * 100}ms`,
                            borderBottom: i < competitors.length - 1 ? `1px solid ${HORIZON.background}` : 'none',
                            backgroundColor: item.current ? HORIZON.primaryLight : 'transparent'
                        }}
                        className={cn(
                            "px-6 py-4 flex items-center justify-between transition-all duration-500",
                            isScanning ? "opacity-0 translate-y-4" : "animate-in fade-in slide-in-from-bottom-2",
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-bold w-6" style={{ color: HORIZON.textSecondary }}>#{item.rank}</span>
                            <div className="relative">
                                {item.current ? (
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                                        style={{ backgroundColor: HORIZON.primary, boxShadow: `0 4px 12px ${HORIZON.primary}40` }}
                                    >
                                        <div className="w-4 h-4">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                            </svg>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: HORIZON.background, border: `1px solid ${HORIZON.secondary}40` }} />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className={`text-sm ${item.current ? 'font-bold' : 'font-medium'}`} style={{ color: item.current ? HORIZON.primary : HORIZON.textPrimary }}>
                                    {item.name}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: HORIZON.background }}>
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 delay-1000"
                                            style={{
                                                width: isScanning ? '0%' : item.score,
                                                backgroundColor: item.current ? HORIZON.error : HORIZON.success
                                            }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold" style={{ color: HORIZON.textSecondary }}>{item.score}</span>
                                </div>
                            </div>
                        </div>

                        {item.current && (
                            <div
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full animate-pulse"
                                style={{ backgroundColor: `${HORIZON.error}15`, border: `1px solid ${HORIZON.error}30` }}
                            >
                                <TrendingDown size={14} style={{ color: HORIZON.error }} />
                                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: HORIZON.error }}>Critical</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
